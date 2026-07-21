import { SelectGroup, SelectItem, SelectLabel } from "@/components/ui/select";
import type { Location } from "@/domain/types";
import { groupLocations, locationLeaf, shouldShowGroupLabel } from "@/lib/locationFormat";

export function LocationSelectItems({ locations }: { locations: Location[] }) {
  return (
    <>
      {groupLocations(locations).map(({ group, items }) => {
        const labeled = shouldShowGroupLabel(items);
        return (
          <SelectGroup key={group}>
            {labeled && <SelectLabel>{group}</SelectLabel>}
            {items.map((l) => (
              <SelectItem key={l.id} value={l.id} className={labeled ? "pl-6" : undefined}>
                {labeled ? locationLeaf(l.name) : l.name}
              </SelectItem>
            ))}
          </SelectGroup>
        );
      })}
    </>
  );
}
