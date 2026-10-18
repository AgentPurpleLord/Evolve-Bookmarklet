/*
 * Evolve mobile UI bookmarklet.
 *
 * Re-skins https://pmotschmann.github.io/Evolve/ for phones: the three desktop
 * columns (resources + log / game tabs / build queue) become full-screen
 * panels that you switch between with a bottom navigation bar.
 *
 * Only CSS classes and one extra element are added; the game's own DOM is never
 * moved, so its Vue bindings keep working. Run the bookmarklet a second time to
 * switch back to the desktop layout.
 */
(function () {
    var NS = 'evm';
    var VIEWS = [
        { id: 'game', label: 'Game' },
        { id: 'res', label: 'Resources' },
        { id: 'log', label: 'Log' }
    ];

    if (window.__evm) {
        window.__evm.toggle();
        return;
    }
    if (!document.getElementById('mainColumn')) {
        alert('Evolve was not found on this page. Open the game first, wait for it to load, then run the bookmarklet again.');
        return;
    }

    var CSS = [
        /* Page shell: top bar / active panel / bottom nav stacked in one flex column. */
        'html.evm{overflow:hidden;height:100%;-webkit-text-size-adjust:100%}',
        'html.evm body{display:flex;flex-direction:column;height:100vh;height:100dvh;margin:0;overflow:hidden;overscroll-behavior:none}',
        'html.evm .promoBar{display:none!important}',

        /* Top bar: let it wrap instead of overflowing, drop the clutter. */
        'html.evm .topBar{position:static!important;display:flex!important;flex-wrap:wrap;flex:none;height:auto!important;line-height:1.25rem!important;padding:0 .5rem;font-size:.8rem;justify-content:space-between;align-items:center}',
        'html.evm .topBar .calendar{margin:0!important;flex:1 1 auto;text-align:right;white-space:normal}',
        'html.evm .topBar .version,html.evm .topBar .infoTimer,html.evm .topBar .universe,html.evm .topBar .simulation{display:none!important}',
        'html.evm .topBar .planetWrap{white-space:nowrap}',

        /* Main area fills the remaining height; each panel scrolls on its own. */
        'html.evm .main{flex:1 1 auto;min-height:0;margin:0!important;overflow:hidden!important;display:flex;flex-direction:column}',
        'html.evm .main>.columns{display:block!important;flex:1 1 auto;min-height:0;margin:0!important;position:relative}',
        'html.evm .main>.columns>.column{display:none;box-sizing:border-box;width:100%!important;max-width:none!important;min-width:0!important;height:100%;padding:.5rem!important;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;flex:none}',
        'html.evm .main>.columns>.leftColumn{height:100%!important}',

        /* Which panel is visible. */
        'html.evm.evm-game #mainColumn{display:block!important}',
        'html.evm.evm-res .leftColumn,html.evm.evm-log .leftColumn{display:block!important}',
        'html.evm.evm-log .queueCol{display:block!important}',
        'html.evm.evm-res #sideQueue{display:none!important}',
        'html.evm.evm-log #resources{display:none!important}',
        'html.evm.evm-log .leftColumn>.race{display:none!important}',

        /* Resources panel: roomy rows that are easy to tap. */
        'html.evm .main .resources{height:auto!important;overflow:visible!important;padding:0!important;margin:0!important;font-size:1rem}',
        'html.evm .main .resources .resource{padding:.2rem 0}',
        'html.evm .main .race{margin:0 0 .5rem!important}',

        /* Log panel: use the whole screen. */
        'html.evm #sideQueue .msgQueue,html.evm #sideQueue .bldQueue{resize:none!important;height:auto!important;max-height:none!important;overflow:visible!important;font-size:.9rem}',
        'html.evm #sideQueue .bldQueue{margin-bottom:.75rem}',
        'html.evm #msgQueueHeader span{margin-left:.75rem!important}',
        'html.evm #msgQueueFilters{display:flex;flex-wrap:nowrap;overflow-x:auto;white-space:nowrap}',
        'html.evm #msgQueueFilters span{padding:.35rem .6rem!important;margin:0!important}',
        'html.evm .main .queueCol .msgQueue.right,html.evm .main .queueCol .bldQueue.right{height:auto!important}',

        /* Game panel: scrollable tab strip, un-capped tab bodies, wrapped button grids. */
        'html.evm #mainColumn .content{margin:0!important}',
        'html.evm #mainColumn .tabs{margin-bottom:.5rem}',
        'html.evm #mainColumn .tabs ul{overflow-x:auto;overflow-y:hidden;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none}',
        'html.evm #mainColumn .tabs ul::-webkit-scrollbar{display:none}',
        'html.evm #mainColumn .tabs li{flex:none}',
        'html.evm #mainColumn .tabs a{white-space:nowrap;padding:.6rem .85rem!important}',
        'html.evm #mainColumn .sticky,html.evm #mainColumn .tab-content,html.evm #mainColumn .tab-item,html.evm #mainColumn section{height:auto!important;max-height:none!important;overflow:visible!important}',
        'html.evm #mainColumn .action{box-sizing:border-box;width:50%;max-width:100%!important;vertical-align:top}',
        'html.evm #mainColumn .action a.button,html.evm #mainColumn .action span.oldTech{box-sizing:border-box;width:calc(100% - .375rem)!important;min-height:2.75rem;white-space:normal;height:auto}',
        '@media (min-width:600px){html.evm #mainColumn .action{width:33.333%}}',
        '@media (min-width:900px){html.evm #mainColumn .action{width:25%}}',
        'html.evm #mainColumn table{display:block;max-width:100%;overflow-x:auto}',
        'html.evm #mainColumn img,html.evm #mainColumn canvas,html.evm #mainColumn svg{max-width:100%}',
        'html.evm #mainColumn .button,html.evm #mainColumn .input,html.evm #mainColumn select{min-height:2.25rem}',

        /* Tooltips / popups / dialogs must fit the screen. */
        'html.evm .popper,html.evm .main>div.popper,html.evm body .modal>div.popper{max-width:calc(100vw - 1rem)!important;width:auto;box-sizing:border-box;font-size:.85rem}',
        'html.evm .modal .modal-card,html.evm .modal .modal-content{width:calc(100vw - 1rem)!important;max-width:none!important;margin:0 .5rem}',
        'html.evm .modal .animation-content{max-width:100vw}',

        /* Bottom navigation. */
        '#evm-nav{display:none}',
        'html.evm #evm-nav{display:flex;flex:none;border-top:1px solid rgba(128,128,128,.5);background:#2b2b2b;padding-bottom:env(safe-area-inset-bottom);position:relative;z-index:11}',
        '#evm-nav button{flex:1 1 0;appearance:none;-webkit-appearance:none;background:transparent;border:0;border-bottom:3px solid transparent;color:#cfcfcf;font:inherit;font-size:1rem;padding:.85rem .25rem;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
        '#evm-nav button.on{color:#fff;border-bottom-color:#f1fa8c;background:rgba(255,255,255,.08)}',
        '#evm-nav button.evm-off{flex:0 0 auto;padding:.85rem .9rem;font-size:.85rem;color:#999}'
    ].join('\n');

    var html = document.documentElement;
    var style = document.createElement('style');
    style.id = NS + '-style';
    style.textContent = CSS;

    var nav = document.createElement('div');
    nav.id = NS + '-nav';
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', 'Evolve mobile navigation');
    var buttons = {};
    VIEWS.forEach(function (v) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = v.label;
        b.setAttribute('role', 'tab');
        b.addEventListener('click', function () { show(v.id); });
        nav.appendChild(b);
        buttons[v.id] = b;
    });
    var off = document.createElement('button');
    off.type = 'button';
    off.className = 'evm-off';
    off.textContent = 'Desktop';
    off.title = 'Switch back to the desktop layout';
    off.addEventListener('click', function () { api.toggle(); });
    nav.appendChild(off);

    var meta, metaOriginal, metaCreated = false;
    var current = 'game';
    var observer;
    var active = false;

    function show(id) {
        current = id;
        VIEWS.forEach(function (v) {
            html.classList.toggle(NS + '-' + v.id, v.id === id);
            buttons[v.id].classList.toggle('on', v.id === id);
            buttons[v.id].setAttribute('aria-selected', v.id === id ? 'true' : 'false');
        });
        var col = document.querySelector(id === 'game' ? '#mainColumn' : '.leftColumn');
        if (col) { col.scrollTop = 0; }
        window.scrollTo(0, 0);
    }

    function attachNav() {
        if (active && document.body && nav.parentNode !== document.body) {
            document.body.appendChild(nav);
        }
    }

    function setViewport(on) {
        meta = document.querySelector('meta[name="viewport"]');
        if (on) {
            var content = 'width=device-width, initial-scale=1, viewport-fit=cover';
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = 'viewport';
                document.head.appendChild(meta);
                metaCreated = true;
            }
            metaOriginal = meta.getAttribute('content');
            meta.setAttribute('content', content);
        } else if (meta) {
            if (metaCreated) { meta.remove(); metaCreated = false; }
            else if (metaOriginal !== null) { meta.setAttribute('content', metaOriginal); }
        }
    }

    var api = window.__evm = {
        toggle: function () { active ? api.disable() : api.enable(); },
        enable: function () {
            if (active) { return; }
            active = true;
            document.head.appendChild(style);
            html.classList.add(NS);
            setViewport(true);
            attachNav();
            show(current);
            // The game rebuilds <body> when the UI is reloaded (theme, language, import...).
            observer = new MutationObserver(attachNav);
            observer.observe(document.body, { childList: true });
            window.dispatchEvent(new Event('resize'));
        },
        disable: function () {
            if (!active) { return; }
            active = false;
            if (observer) { observer.disconnect(); }
            VIEWS.forEach(function (v) { html.classList.remove(NS + '-' + v.id); });
            html.classList.remove(NS);
            style.remove();
            nav.remove();
            setViewport(false);
            window.dispatchEvent(new Event('resize'));
        }
    };

    api.enable();
})();
