# Evolve Bookmarklet

A bookmarklet that gives [Evolve](https://pmotschmann.github.io/Evolve/) a mobile-friendly UI.

The desktop layout's three columns (resources + message log, game tabs, build queue) become full-screen panels, switched with a bottom bar:

- **Game**: the morale / power (MW) header and the building queue stay pinned on top; the tab strip scrolls sideways; action buttons form a 2/3/4-column tap-friendly grid.
- **Resources**: the resource list at full width.
- **Log**: message log and build queue, full height.

New log messages appear in a slim strip at the top of the bottom bar (so nothing covers the game): several in a row play one after another, a long one wraps to two lines, tap the strip to open the Log, and nothing shows while the Log panel is open.

**Visuals.** An animated 2D scene sits above the tabs on the Game panel: the sky follows a day/night cycle paced by the game's own day length (it pauses when the game is paused), the ground, foliage and sky follow the season and weather read from the game's top bar (rain, snow, wind, storms), and a little village grows as you build. New log messages set off sparks (a red flash for danger), and taps on game buttons ripple. Switch the scene and the effects off from the ⏩ popup (Visuals); they respect your device's reduced-motion setting and the scene only animates while the Game panel is open and the page is visible.

**Step multiplier (right end of the bottom bar).** Tap to cycle ×1 → ×10 → ×25 → ×100. While it is highlighted, every « » stepper and build/craft button acts as if you were holding Ctrl (×10), Shift (×25) or Alt (×100) on a PC. It uses the game's default key bindings and its "multiplier keys" setting, and resets to ×1 when you reload.

**Game speed (top right).** The ⏩ chip opens a popup with presets (×1 to ×100) and a custom field (0.25–100×) that speeds up the game's clock. The real limit is how fast your phone can run the game; the speed resets when the page reloads, and a speed picked while the game is paused applies when you resume.

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
