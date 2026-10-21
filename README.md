# Evolve Bookmarklet

A bookmarklet that gives [Evolve](https://pmotschmann.github.io/Evolve/) a mobile-friendly UI.

The desktop layout's three columns (resources + message log, game tabs, build queue) become full-screen panels, switched with a bottom bar:

- **Game**: the morale / power (MW) header stays pinned on top; the tab strip scrolls sideways; action buttons form a 2/3/4-column tap-friendly grid.
- **Resources**: the resource list at full width.
- **Log**: message log and build queue, full height.

Tooltips and dialogs are constrained to the screen width. The game's own DOM is never moved, only restyled, so it keeps working normally.

## Install

Three ways, best first (the install page `index.html` walks through them):

1. **Userscript (recommended, e.g. Firefox for Android).** Install Violentmonkey or Tampermonkey, then open
   `https://raw.githubusercontent.com/AgentPurpleLord/Evolve-Bookmarklet/main/evolve-mobile.user.js` and confirm the install.
   It runs automatically whenever you open Evolve on a phone-sized screen and updates itself, so there is no bookmark to maintain.
2. **Loader bookmarklet.** Saved once, it fetches the latest `src/evolve-mobile.js` (via jsDelivr, which can cache `@main` for up to ~12 hours) each time it is tapped.
3. **Self-contained bookmarklet** (`bookmarklet.txt`). Works offline but must be re-copied after every update.

## Use

1. Open the game and let it load. With the userscript the layout switches on by itself; with a bookmarklet, tap it.
2. To go back to the normal layout for that visit, run the bookmarklet a second time (or turn the userscript off in your manager).

## Develop

- `src/evolve-mobile.js`: readable source (CSS and a small amount of JS).
- `src/install.template.html`: install page template.
- `npm install && npm run build`: regenerates `bookmarklet.txt`, `evolve-mobile.user.js` (its `@version` is bumped from the git commit count so managers see each update) and `index.html`. Commit all three.
