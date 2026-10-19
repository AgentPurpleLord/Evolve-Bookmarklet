// Builds everything from src/evolve-mobile.js:
//   bookmarklet.txt            self-contained javascript: URL (needs re-copying when the code changes)
//   evolve-mobile.user.js      userscript for Violentmonkey/Tampermonkey: runs automatically and self-updates
//   index.html                 install page (from src/install.template.html)
// The loader bookmarklet (shown on the install page) just fetches src/evolve-mobile.js from jsDelivr, so it never goes stale.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { minify } = require('terser');

const REPO = 'AgentPurpleLord/Evolve-Bookmarklet';
const BRANCH = 'main';
const USERSCRIPT_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/evolve-mobile.user.js`;
const SOURCE_URL = `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/src/evolve-mobile.js`;

const file = (...p) => path.join(__dirname, ...p);
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

(async () => {
    const source = fs.readFileSync(file('src', 'evolve-mobile.js'), 'utf8');

    // 1. Self-contained bookmarklet.
    const { code } = await minify(source, { compress: true, mangle: true, format: { comments: false } });
    const bookmarklet = 'javascript:' + encodeURIComponent(code);
    fs.writeFileSync(file('bookmarklet.txt'), bookmarklet + '\n');

    // 2. Loader bookmarklet: always runs the latest published source.
    const loaderCode = `(function(){var s=document.createElement('script');s.src='${SOURCE_URL}';document.head.appendChild(s)})()`;
    const loader = 'javascript:' + encodeURIComponent(loaderCode);

    // 3. Userscript. Version must increase with every change so managers pick up updates.
    let build = 0;
    try { build = parseInt(execSync('git rev-list --count HEAD', { cwd: __dirname }).toString(), 10) || 0; } catch (e) { /* not a git checkout */ }
    const pkg = require('./package.json');
    const header = [
        '// ==UserScript==',
        '// @name         Evolve Mobile UI',
        `// @namespace    https://github.com/${REPO}`,
        `// @version      ${pkg.version}.${build}`,
        '// @description  Mobile-friendly layout for Evolve (Game / Resources / Log panels, scrollable tabs).',
        '// @match        https://pmotschmann.github.io/Evolve/*',
        '// @match        https://pmotschmann.github.io/Evolve',
        '// @run-at       document-idle',
        '// @grant        none',
        `// @updateURL    ${USERSCRIPT_URL}`,
        `// @downloadURL  ${USERSCRIPT_URL}`,
        '// ==/UserScript==',
        ''
    ].join('\n');
    const wrapper = `
(function () {
    // The game builds its UI asynchronously: wait for it.
    var tries = 0;
    var timer = setInterval(function () {
        if (document.getElementById('mainColumn')) {
            clearInterval(timer);
            setTimeout(start, 300);
        } else if (++tries > 200) {
            clearInterval(timer);
        }
    }, 300);
    function start() {
        // Only switch the layout on phone-sized screens (phones report a 980px window until the viewport tag
        // is applied, so look at the device's screen too); run the bookmarklet by hand to force it elsewhere.
        if (Math.min(window.screen.width, window.innerWidth) > 900) { return; }
${source.split('\n').map((l) => (l ? '        ' + l : l)).join('\n')}
    }
})();
`;
    fs.writeFileSync(file('evolve-mobile.user.js'), header + wrapper);

    // 4. Install page.
    const template = fs.readFileSync(file('src', 'install.template.html'), 'utf8');
    const html = template
        .replace(/\{\{USERSCRIPT_URL\}\}/g, attr(USERSCRIPT_URL))
        .replace(/\{\{LOADER\}\}/g, attr(loader))
        .replace(/\{\{BOOKMARKLET\}\}/g, attr(bookmarklet));
    fs.writeFileSync(file('index.html'), html);

    console.log(`bookmarklet: ${bookmarklet.length} chars, loader: ${loader.length} chars, userscript v${pkg.version}.${build}`);
})();
