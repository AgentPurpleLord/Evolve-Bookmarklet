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
        'html.evm.evm-game #mainColumn{display:block!important;overflow-x:auto!important}',
        /* Game panel: keep the race / morale / power (MW) header pinned above the tabs, as the desktop sidebar does. */
        'html.evm.evm-game .main>.columns{display:flex!important;flex-direction:column}',
        'html.evm.evm-game .main>.columns>.leftColumn{display:block!important;flex:none;height:auto!important;padding:.25rem .5rem 0!important;overflow:visible}',
        'html.evm.evm-game .leftColumn #sideQueue,html.evm.evm-game .leftColumn #resources{display:none!important}',
        'html.evm.evm-game .leftColumn .race{margin:0!important}',
        'html.evm.evm-game .main>.columns>#mainColumn{flex:1 1 auto;min-height:0;height:auto!important}',
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
        /* Tab strips (main tabs + the location/sub tabs that grow as you progress): the <nav class="tabs"> is the one horizontal scroller. */
        'html.evm #mainColumn .tabs{display:flex!important;margin-bottom:.5rem!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch;scrollbar-width:none;touch-action:pan-x pan-y;overscroll-behavior-x:contain}',
        'html.evm #mainColumn .tabs::-webkit-scrollbar{display:none}',
        'html.evm #mainColumn .tabs ul{flex:0 0 auto!important;flex-wrap:nowrap!important;overflow:visible!important;width:max-content;min-width:100%;margin-left:0!important}',
        'html.evm #mainColumn .tabs li{flex:none}',
        'html.evm #mainColumn .tabs a{white-space:nowrap;padding:.6rem .7rem!important}',
        /* Edge shading shows there are more tabs off-screen. */
        'html.evm #mainColumn .tabs.evm-more-r{box-shadow:inset -1.25rem 0 .75rem -.75rem rgba(128,128,128,.55)}',
        'html.evm #mainColumn .tabs.evm-more-l{box-shadow:inset 1.25rem 0 .75rem -.75rem rgba(128,128,128,.55)}',
        'html.evm #mainColumn .tabs.evm-more-l.evm-more-r{box-shadow:inset 1.25rem 0 .75rem -.75rem rgba(128,128,128,.55),inset -1.25rem 0 .75rem -.75rem rgba(128,128,128,.55)}',
        /* Tab bodies: always in normal flow beneath their strip (the game makes them sticky and Buefy slides them with position:absolute). */
        'html.evm #mainColumn .b-tabs{display:block!important}',
        'html.evm #mainColumn .b-tabs>.tab-content,html.evm #mainColumn .b-tabs .tab-item,html.evm #mainColumn .b-tabs>.tab-content>.tab-item{position:static!important;top:auto!important;bottom:auto!important;transform:none!important;transition:none!important;animation:none!important;margin-top:0!important}',
        'html.evm #mainColumn .b-tabs>.tab-content{display:block!important;clear:both;padding-left:0!important;padding-right:0!important}',
        'html.evm #mainColumn .tab-item{padding-left:0!important;padding-right:0!important}',
        'html.evm #mainColumn .tabs{position:relative;z-index:2;flex:none!important}',
        'html.evm #mainColumn .sticky,html.evm #mainColumn .tab-content,html.evm #mainColumn .tab-item,html.evm #mainColumn section{height:auto!important;max-height:none!important;overflow:visible!important}',
        'html.evm #mainColumn .action{box-sizing:border-box;width:50%;max-width:100%!important;vertical-align:top}',
        'html.evm #mainColumn .action a.button,html.evm #mainColumn .action span.oldTech{box-sizing:border-box;width:calc(100% - .375rem)!important;min-height:2.75rem;white-space:normal;height:auto}',
        '@media (min-width:600px){html.evm #mainColumn .action{width:33.333%}}',
        '@media (min-width:900px){html.evm #mainColumn .action{width:25%}}',
        'html.evm #mainColumn table{display:block;max-width:100%;overflow-x:auto}',
        'html.evm #mainColumn img,html.evm #mainColumn canvas,html.evm #mainColumn svg{max-width:100%}',
        'html.evm #mainColumn .button:not(.b-radio):not(.b-checkbox),html.evm #mainColumn .input,html.evm #mainColumn select{min-height:2.25rem}',

        /* Market, storage and other rows are laid out with fixed desktop margins/widths: let them wrap. */
        'html.evm #mainColumn .market-item{flex-wrap:wrap;margin-left:0!important;row-gap:.15rem;padding:.4rem 0;border-bottom:1px solid rgba(128,128,128,.22)}',
        'html.evm #mainColumn .market-item .res{width:7.5rem}',
        'html.evm #mainColumn .market-item .trade{min-width:0;margin-left:.5rem}',
        'html.evm #mainColumn .market-item .crtTotal,html.evm #mainColumn .market-item .cntTotal,html.evm #mainColumn .market-item .tradeTotal,html.evm #mainColumn .market-item .tradeTotal.nt{margin-left:0!important}',
        /* Market resource rows: name + buy/sell on one line, trade-route controls on a full-width line below. */
        'html.evm #mainColumn .market-item[id^="market-"]{display:grid;grid-template-columns:minmax(4.5rem,1.2fr) auto 1fr auto 1fr;align-items:center;gap:.35rem .4rem}',
        'html.evm #mainColumn .market-item[id^="market-"] .res{width:auto;margin:0}',
        'html.evm #mainColumn .market-item[id^="market-"] .buy,html.evm #mainColumn .market-item[id^="market-"] .sell{margin:0}',
        'html.evm #mainColumn .market-item[id^="market-"] .order{min-width:0;min-height:2rem;display:flex;align-items:center;justify-content:center;box-sizing:border-box}',
        'html.evm #mainColumn .market-item[id^="market-"] .trade{grid-column:1/-1;display:flex;align-items:center;gap:.5rem;margin:0;padding-top:.15rem}',
        'html.evm #mainColumn .market-item .trade .sub,html.evm #mainColumn .market-item .trade .add{display:inline-block;min-width:2.5rem;padding:.3rem .6rem!important;line-height:1.2rem!important;text-align:center;top:0!important;border:1px solid rgba(128,128,128,.55);border-radius:.3rem;font-size:1.1rem}',
        'html.evm #mainColumn .market-item .trade .current{width:3.25rem;text-align:center}',
        'html.evm #mainColumn .market-item .trade .zero{margin-left:auto;padding:.4rem .25rem}',
        /* Other market-style panels (ejector, supply, alchemy, galactic trade): keep controls tappable. */
        'html.evm #mainColumn .market-item .res{margin-right:.5rem}',
        'html.evm #mainColumn #market-qty{margin-bottom:.5rem}',
        'html.evm #mainColumn .storage-header .crate,html.evm #mainColumn .storage-header .container{margin-left:0!important;margin-right:.5rem;display:inline-block}',
        'html.evm #mainColumn .storage-header{display:flex;flex-wrap:wrap;gap:.25rem .5rem}',
        'html.evm #mainColumn .market-item,html.evm #mainColumn .market-item>*{max-width:100%}',

        /* Fuel / smelting controls are flat runs of  [«] name [»]  spans: keep each triple together, one per row. */
        'html.evm #mainColumn .fuels{display:grid;grid-template-columns:2.75rem minmax(7rem,11rem) 2.75rem;justify-content:center;gap:.3rem 0;margin-top:.4rem}',
        'html.evm #mainColumn .fuels .sub,html.evm #mainColumn .fuels .add{display:flex;align-items:center;justify-content:center;margin:0;padding:0;min-height:2rem}',
        'html.evm #mainColumn .fuels .current{display:block;text-align:center;line-height:2rem;min-width:0;min-height:2rem;font-size:1rem;padding:0 .25rem}',
        'html.evm #mainColumn .fuels .current.infoOnly{grid-column:1/-1}',
        /* Governor: crate/container balance rows (name + 0x..4x toggles) in two tidy columns. */
        'html.evm #mainColumn .govOffice .bal_storage .ccmOption>span{width:5.25rem}',
        'html.evm #mainColumn .govOffice .options .storage{flex-wrap:wrap;gap:.25rem}',
        'html.evm #mainColumn .govOffice .options .storage>div{width:calc(50% - .5rem)}',

        /* Tooltips / popups / dialogs must fit the screen. */
        'html.evm .popper,html.evm .main>div.popper,html.evm body .modal>div.popper{max-width:calc(100vw - 1rem)!important;width:auto;box-sizing:border-box;font-size:.85rem}',
        'html.evm .modal .modal-card,html.evm .modal .modal-content{box-sizing:border-box;width:calc(100vw - 1rem)!important;min-width:0!important;max-width:calc(100vw - 1rem)!important;margin:0 .5rem;overflow-x:hidden}',
        'html.evm .modal .modalBody,html.evm .modal .modal-content>div{max-width:100%;max-height:calc(100vh - 4rem);max-height:calc(100dvh - 4rem);overflow-y:auto;overflow-x:hidden}',
        'html.evm .modal .actionSpace{min-width:0!important}',
        'html.evm .modal .crates,html.evm .modal .crateHead,html.evm .modal .modal-content p{white-space:normal}',
        'html.evm .modal .crates .crateHead span{display:inline-block}',
        'html.evm .modal .crates button{margin:.2rem .15rem!important}',
        'html.evm .modal .animation-content{max-width:100vw}',

        /* Bottom navigation. */
        '#evm-nav{display:none}',
        'html.evm #evm-nav{display:flex;flex:none;border-top:1px solid rgba(128,128,128,.5);background:#2b2b2b;padding-bottom:env(safe-area-inset-bottom);position:relative;z-index:11}',
        '#evm-nav button{flex:1 1 0;appearance:none;-webkit-appearance:none;background:transparent;border:0;border-bottom:3px solid transparent;color:#cfcfcf;font:inherit;font-size:1rem;padding:.85rem .25rem;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
        '#evm-nav button.on{color:#fff;border-bottom-color:#f1fa8c;background:rgba(255,255,255,.08)}'
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

    /* Tab strips are created by the game as you unlock things, so work on whatever exists. */
    function updateHints() {
        var strips = document.querySelectorAll('#mainColumn .tabs');
        for (var i = 0; i < strips.length; i++) {
            var t = strips[i];
            t.classList.toggle(NS + '-more-l', t.scrollLeft > 4);
            t.classList.toggle(NS + '-more-r', t.scrollLeft + t.clientWidth < t.scrollWidth - 4);
        }
    }

    function onTabClick(e) {
        var li = e.target.closest ? e.target.closest('#mainColumn .tabs li') : null;
        if (li) {
            setTimeout(function () {
                var strip = li.closest('.tabs');
                if (strip) {
                    var r = li.getBoundingClientRect(), s = strip.getBoundingClientRect();
                    strip.scrollBy({ left: (r.left + r.width / 2) - (s.left + s.width / 2), behavior: 'smooth' });
                }
                updateHints();
            }, 50);
        }
    }

    var hintTimer;

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
            document.addEventListener('scroll', updateHints, true);
            document.addEventListener('click', onTabClick, true);
            window.addEventListener('resize', updateHints);
            hintTimer = setInterval(updateHints, 750);
            updateHints();
            window.dispatchEvent(new Event('resize'));
        },
        disable: function () {
            if (!active) { return; }
            active = false;
            if (observer) { observer.disconnect(); }
            document.removeEventListener('scroll', updateHints, true);
            document.removeEventListener('click', onTabClick, true);
            window.removeEventListener('resize', updateHints);
            clearInterval(hintTimer);
            [].forEach.call(document.querySelectorAll('.' + NS + '-more-l,.' + NS + '-more-r'), function (el) {
                el.classList.remove(NS + '-more-l', NS + '-more-r');
            });
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
