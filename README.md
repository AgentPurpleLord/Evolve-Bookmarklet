# Evolve Bookmarklet

A bookmarklet that gives [Evolve](https://pmotschmann.github.io/Evolve/) a mobile-friendly UI.

The desktop layout's three columns (resources + message log, game tabs, build queue) become full-screen panels, switched with a bottom bar:

- **Game**: the tab strip scrolls sideways; action buttons form a 2/3/4-column tap-friendly grid.
- **Resources**: the resource list at full width.
- **Log**: message log and build queue, full height.
- **Desktop**: switches back to the original layout (running the bookmarklet again does the same).

Tooltips and dialogs are constrained to the screen width. The game's own DOM is never moved, only restyled, so it keeps working normally.

## Install

Open `index.html` (or the hosted copy, if you publish this repo with GitHub Pages) and follow the instructions: drag the link to your bookmarks bar, or on a phone copy the code and paste it into a bookmark's URL field. The same code is in `bookmarklet.txt`.

## Use

1. Open the game and let it load.
2. Run the bookmarklet. Run it again after each page reload.

## Develop

- `src/evolve-mobile.js`: readable source (CSS and a small amount of JS).
- `src/install.template.html`: install page template.
- `npm install && npm run build`: regenerates `bookmarklet.txt` and `index.html`. Commit both.
