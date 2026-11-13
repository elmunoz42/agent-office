# UI prototype

Several **radically different** variants of one screen, switchable in the browser, so the requester can flip between them, pick one, or take parts of each.

## Where it lives

On a **throwaway route** whose path contains `prototype` (for example `/prototype/pricing`), following the project's routing convention, with its components in `prototypes/YYYY-MM-DD-slug/`. The route file is the only thing added outside `prototypes/`, and it only imports from that folder.

Do not render variants on an existing route. Other agents share this working tree, and QA tests run against the real routes; a prototype must not change what they see. To judge the design against the real app, reuse the real layout, header and read-only data inside the throwaway route.

## Build

1. **State the plan in one line** at the top of the README: for example "Three variants of the pricing page at `/prototype/pricing?variant=`".
2. **Default to three variants, never more than five.** They must differ in structure: layout, information hierarchy, primary action. Three tweaked card grids is wallpaper, not a prototype. If two come out alike, redo one with an explicit constraint ("no card grid").
3. **Switch with `?variant=A|B|C`** so each variant has a shareable, reload-stable URL.
4. **Add a small floating bar** at the bottom centre: previous, the current variant's key and name, next. Arrow keys cycle too, except while typing in a field. Make it visibly not part of the design.
5. **Read only.** Point anything that would write at a stub.
6. Use the project's existing styling system and components.

## Hand over

Give the URL and the variant keys. If the project has a served build that others test against, say whether the prototype route is in it. The useful feedback is usually "the header from B with the list from C": that combination is the design.

## After the verdict

Remove the throwaway route file when the slice is built or the idea is rejected. The variants stay in `prototypes/` as the record. The winner is rewritten properly during the build, not promoted.

## Avoid

- Variants that differ only in colour or copy.
- A shared layout component across variants; each must be free to discard the layout.
- Touching existing routes, components or tests.
