# Fonts

The first binary assets this repository carries. That is a deliberate act rather
than a side effect, so it is written down here.

## Why self-hosted rather than linked

`CLAUDE.md` says no network dependency for core play, and first paint is core
play. A `<link>` to `fonts.googleapis.com` is a network dependency before a
single number renders: it blocks on DNS, on a CDN, and on a third party staying
up and staying free. It also leaks a request to a third party on every load,
which a game with no accounts and no backend has no business doing.

So the files sit here, `@font-face` in `src/index.css` points at them by relative
path, Vite fingerprints and emits them, and the game renders from its own origin
or from nothing.

## What is here

    fredoka-latin-var.woff2    Fredoka, variable, weight axis 300 to 700, latin
    nunito-latin-var.woff2     Nunito,  variable, weight axis 200 to 1000, latin

Both are the variable builds and both are the latin subset only. Variable rather
than static instances because `DESIGN.md` asks for Nunito across 400 to 900,
which is six static files against one variable one. Latin subset only because
nothing in the game is written in any other script yet, and adding cyrillic,
greek, hebrew and vietnamese coverage nobody reads would roughly triple the
bytes. When the game is localised, take the subsets that localisation needs.

## Source and licence

Both families are under the SIL Open Font License 1.1. The full licence text for
each sits beside the file it covers, as the OFL requires:

    OFL-Fredoka.txt    Copyright 2016 The Fredoka Project Authors
    OFL-Nunito.txt     Copyright 2014 The Nunito Project Authors

Retrieved 2026-07-29 from the Google Fonts CDN, at the versions Google Fonts was
serving on that date:

    Fredoka v17   fonts.gstatic.com/s/fredoka/v17/X7n64b87HvSqjb_WIi2yDCRwoQ_k7367_DWu89U.woff2
    Nunito  v32   fonts.gstatic.com/s/nunito/v32/XRXV3I6Li01BKofINeaB.woff2

Licence text from `github.com/google/fonts`, `ofl/fredoka/OFL.txt` and
`ofl/nunito/OFL.txt`.

The OFL permits bundling and redistribution as part of a larger work. It requires
that the licence travel with the fonts, that the fonts are not sold on their own,
and that any modified version is renamed. None of these files is modified.
