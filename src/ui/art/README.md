# Hand-authored art

The first drawn illustration in this project, added by UPDATELOGV12.md stage 2.

Everything else in the illustration set is computed. `Blob.tsx` contains no path
data by rule: a blob reads carbon and phosphate weights out of the pool table and
draws itself, so glucose has six sides because glucose carries six carbon. That
set inherits the palette, the stroke weight and the accessibility guarantees for
free, because it never names a colour at all.

Nothing in this directory can be derived from anything. There is no table that
says what a banded iron formation looks like. So the assets here are the one
place in the game that could quietly leave the palette and quietly ignore a
user's colour setting at the same time, in a file nobody diffs.

## The rule

DESIGN.md, Hand-authored art, written before the first asset was drawn.

1. **Tokens only, and by reference.** Every colour is `var(--color-*)` naming a
   token defined in `src/index.css`, or `none`, or `currentColor`. No hex
   literal, no `rgb()`, no CSS colour keyword, ever. Reference rather than value
   is what makes a palette change move the art and what lets one `forced-colors`
   block redirect the whole set.
2. **Ink carries the reading.** Every asset must be legible with all of its fills
   removed. A meaning that lives only in a fill dies under `forced-colors`, dies
   under DESIGN.md's colour rule, and dies in a photocopy.
3. **One stroke band.** `stroke-width` 3 to 3.5, `stroke-linejoin: round`, which
   is the illustration language's own specification, so drawn and computed art
   cannot be told apart by weight.
4. **Nothing the rest of the system forbids.** No gradient, no blur, no filter,
   no raster, no opacity below 0.85.

## The mechanism

`src/ui/__tests__/art.test.ts` walks this directory and fails the build on any
of the four. It reads the token names out of `src/index.css` rather than from a
list, the same parse `designSystem.test.ts` already does, so the dependency runs
DESIGN.md to `index.css` to the art.

A guard that agrees with its own list is not a guard, so the walk is asserted
against the directory listing and every check is proved against a planted
violation rather than trusted.

## Conventions

One asset per file, one exported component per asset, `48 x 48` viewBox, sized by
a `size` prop. Every asset is `aria-hidden`, because the card that carries it
carries the name, and a `<title>` inside an asset would be a player-facing string
outside `src/ui/content/`.
