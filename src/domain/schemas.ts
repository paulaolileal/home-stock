import { z } from "zod";

/** Sanitiza string removendo tags HTML e caracteres de controle. */
const safeString = (max = 200) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .transform((v) => {
      const noTags = v.replace(/<[^>]*>/g, "");
      return [...noTags].filter((c) => c.charCodeAt(0) > 31 && c.charCodeAt(0) !== 127).join("");
    });

export const productInputSchema = z.object({
  name: safeString(120),
  category: safeString(60),
  location: safeString(60),
  quantity: z.number().nonnegative(),
  minQuantity: z.number().nonnegative(),
  idealQuantity: z.number().nonnegative(),
  unit: safeString(30),
  brand: safeString(80).optional(),
  barcode: z.string().trim().max(30).optional(),
  image: z.string().trim().url().optional(),
  favorite: z.boolean().default(false),
  inCart: z.boolean().optional(),
});

export const categoryNameSchema = safeString(60);
export const locationNameSchema = safeString(60);

export type ProductInput = z.infer<typeof productInputSchema>;
