// Minifies src/evolve-mobile.js into a javascript: URL and writes it to
// bookmarklet.txt and into the install page (index.html, from src/install.template.html).
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

(async () => {
    const source = fs.readFileSync(path.join(__dirname, 'src', 'evolve-mobile.js'), 'utf8');
    const { code } = await minify(source, { compress: true, mangle: true, format: { comments: false } });
    const url = 'javascript:' + encodeURIComponent(code);
    fs.writeFileSync(path.join(__dirname, 'bookmarklet.txt'), url + '\n');

    const template = fs.readFileSync(path.join(__dirname, 'src', 'install.template.html'), 'utf8');
    const attr = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    fs.writeFileSync(path.join(__dirname, 'index.html'), template.replace(/\{\{BOOKMARKLET\}\}/g, attr));
    console.log(`bookmarklet: ${url.length} characters`);
})();
