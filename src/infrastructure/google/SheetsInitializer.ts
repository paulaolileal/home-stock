import { googleApiFetch } from "./googleApiFetch";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

interface SheetSpec {
  title: string;
  headers: string[];
}

const SHEET_SPECS: SheetSpec[] = [
  {
    title: "products",
    headers: [
      "product_id",
      "name",
      "category_id",
      "location_id",
      "quantity",
      "min_quantity",
      "ideal_quantity",
      "unit",
      "notes",
      "barcode",
      "image",
      "favorite",
      "in_cart",
      "updated_at",
      "wanted",
    ],
  },
  {
    title: "categories",
    headers: ["category_id", "name", "emoji"],
  },
  {
    title: "locations",
    headers: ["location_id", "name"],
  },
];

type CreatedSheet = { properties: { sheetId: number; title: string } };
type CreateResponse = { spreadsheetId: string; sheets: CreatedSheet[] };
type AddSheetReply = {
  replies: { addSheet?: { properties: { title: string; sheetId: number } } }[];
};

export class SheetsInitializer {
  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    return googleApiFetch<T>(url, { ...init, apiLabel: "Sheets API" });
  }

  async createSpreadsheet(title: string): Promise<string> {
    const created = await this.request<CreateResponse>(SHEETS_API, {
      method: "POST",
      body: JSON.stringify({
        properties: { title },
        sheets: SHEET_SPECS.map((spec, idx) => ({
          properties: { sheetId: idx, title: spec.title, index: idx },
        })),
      }),
    });

    const { spreadsheetId, sheets } = created;

    const sheetIdMap: Record<string, number> = {};
    for (const s of sheets) {
      sheetIdMap[s.properties.title] = s.properties.sheetId;
    }

    const requests = SHEET_SPECS.map((spec) => ({
      updateCells: {
        range: {
          sheetId: sheetIdMap[spec.title],
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: spec.headers.length,
        },
        rows: [
          {
            values: spec.headers.map((h) => ({
              userEnteredValue: { stringValue: h },
            })),
          },
        ],
        fields: "userEnteredValue",
      },
    }));

    await this.request(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests }),
    });

    return spreadsheetId;
  }

  async ensureSheets(spreadsheetId: string): Promise<void> {
    type SpreadsheetMeta = { sheets: CreatedSheet[] };
    const meta = await this.request<SpreadsheetMeta>(
      `${SHEETS_API}/${spreadsheetId}?fields=sheets.properties`,
    );

    const sheetIdMap = new Map<string, number>(
      meta.sheets.map((s) => [s.properties.title, s.properties.sheetId]),
    );

    const missing = SHEET_SPECS.filter((spec) => !sheetIdMap.has(spec.title));
    if (missing.length > 0) {
      const result = await this.request<AddSheetReply>(
        `${SHEETS_API}/${spreadsheetId}:batchUpdate`,
        {
          method: "POST",
          body: JSON.stringify({
            requests: missing.map((spec) => ({ addSheet: { properties: { title: spec.title } } })),
          }),
        },
      );
      for (const reply of result.replies) {
        if (reply.addSheet) {
          sheetIdMap.set(reply.addSheet.properties.title, reply.addSheet.properties.sheetId);
        }
      }
    }

    await this.request(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        requests: SHEET_SPECS.map((spec) => ({
          updateCells: {
            range: {
              sheetId: sheetIdMap.get(spec.title)!,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: spec.headers.length,
            },
            rows: [{ values: spec.headers.map((h) => ({ userEnteredValue: { stringValue: h } })) }],
            fields: "userEnteredValue",
          },
        })),
      }),
    });
  }
}
