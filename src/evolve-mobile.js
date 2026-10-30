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
        'html.evm.evm-game .leftColumn #resources,html.evm.evm-game .leftColumn #msgQueue{display:none!important}',
        /* The build queue sits under the header, above the tabs, so it is visible while building. */
        'html.evm.evm-game .leftColumn #sideQueue .bldQueue{max-height:6.5rem!important;overflow-y:auto!important;margin:.25rem 0 0!important;font-size:.85rem;padding-bottom:.15rem}',
        'html.evm.evm-game .main>.columns>.queueCol{display:block!important;flex:none;order:1;height:auto!important;padding:0 .5rem!important;overflow:visible}',
        'html.evm.evm-game .main>.columns>.queueCol:empty{display:none!important}',
        'html.evm.evm-game .queueCol div.bldQueue:first-child{margin-top:.25rem!important}',
        'html.evm.evm-game .queueCol .msgQueue{display:none!important}',
        'html.evm.evm-game .main>.columns>#mainColumn{order:2}',
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

        /* All « » steppers: finger-sized (the factory, quarry slider, jobs, etc.). */
        'html.evm #mainColumn .sub,html.evm #mainColumn .add{display:inline-flex;align-items:center;justify-content:center;min-width:2.5rem;min-height:2rem;padding:0 .5rem;vertical-align:middle;box-sizing:border-box}',
        'html.evm #mainColumn .current{display:inline-block;min-height:2rem;line-height:2rem;vertical-align:middle}',
        'html.evm #mainColumn .factory>div,html.evm #mainColumn .factory>span{margin-bottom:.2rem}',
        /* Job rows (Government tab): label shrinks, the « » pair never wraps. */
        'html.evm #mainColumn .job{min-width:0;margin-left:0;margin-bottom:.15rem}',
        'html.evm #mainColumn .job .job_label{flex:1 1 auto;min-width:0}',
        'html.evm #mainColumn .job .job_label>:first-child{width:auto!important;flex:1 1 6rem;min-width:0;overflow-wrap:anywhere}',
        'html.evm #mainColumn .job .controls{display:flex;flex:none;flex-wrap:nowrap;margin:0 0 0 .5rem}',

        /* Fuel / smelting controls are flat runs of  [«] name [»]  spans: keep each triple together, one per row. */
        'html.evm #mainColumn .fuels{display:grid;grid-template-columns:2.75rem minmax(7rem,11rem) 2.75rem;justify-content:center;gap:.3rem 0;margin-top:.4rem}',
        'html.evm #mainColumn .fuels .sub,html.evm #mainColumn .fuels .add{display:flex;align-items:center;justify-content:center;margin:0;padding:0;min-height:2rem}',
        'html.evm #mainColumn .fuels .current{display:block;text-align:center;line-height:2rem;min-width:0;min-height:2rem;font-size:1rem;padding:0 .25rem}',
        'html.evm #mainColumn .fuels .current.infoOnly{grid-column:1/-1}',
        /* Hell Dimension fortress: Stationed / Patrols / Patrol Size as  label [«] value [»]  rows; training line + observe button. */
        'html.evm #mainColumn .fort{min-height:0}',
        'html.evm #mainColumn .fort>div:has(>.armyLabel){display:grid;grid-template-columns:max-content 2.75rem 4.5rem 2.75rem;justify-content:start;align-items:center;gap:.3rem 0}',
        'html.evm #mainColumn .fort>div:has(>.armyLabel)>span:not(.sub):not(.add):not(.current):not(.hireLabel){padding-right:.6rem}',
        'html.evm #mainColumn .fort>div:has(>.armyLabel)>.hireLabel,html.evm #mainColumn .fort>div:has(>.armyLabel)>div{grid-column:1/-1}',
        'html.evm #mainColumn .fort .sub,html.evm #mainColumn .fort .add{display:flex;align-items:center;justify-content:center;margin:0;padding:0;min-height:2rem}',
        'html.evm #mainColumn .fort .current{display:block;text-align:center;line-height:2rem;min-width:0;min-height:2rem;font-size:1rem;padding:0 .25rem;bottom:0}',
        'html.evm #mainColumn .fort .training{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem .5rem}',
        'html.evm #mainColumn .fort .training progress{order:3;display:block;width:100%!important;height:.7rem}',
        'html.evm #mainColumn .fort .observe{float:none!important;height:auto;line-height:1.2;margin:0 0 0 auto!important;padding:.35rem .6rem;bottom:0}',
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

        /* Log messages: a slim strip at the top of the bottom bar (so nothing covers the game). */
        '#evm-ticker{display:flex;align-items:center;box-sizing:border-box;min-height:1.7rem;padding:.2rem .65rem;overflow:hidden;background:rgba(0,0,0,.25);border-bottom:1px solid rgba(128,128,128,.25);font-size:.85rem;line-height:1.2;cursor:pointer}',
        '#evm-ticker .msg{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;opacity:0;transform:translateY(.7rem);transition:opacity .25s ease-out,transform .25s ease-out}',
        '#evm-ticker.live .msg{opacity:1;transform:none}',

        /* Animated scene above the tabs, tap ripples, press feedback. */
        '#evm-scene{display:none}',
        'html.evm.evm-game.evm-scene-on #evm-scene{display:block;order:1;flex:none;height:58px;margin:.25rem .5rem 0;border-radius:.5rem;overflow:hidden;box-shadow:0 0 0 1px rgba(128,128,128,.35);cursor:pointer}',
        '#evm-scene canvas{display:block;width:100%;height:58px}',
        '.evm-ripple{position:fixed;width:14px;height:14px;margin:-7px 0 0 -7px;border:2px solid rgba(241,250,140,.9);border-radius:50%;pointer-events:none;z-index:50;animation:evm-rip .55s ease-out forwards}',
        '@keyframes evm-rip{from{transform:scale(.3);opacity:.95}to{transform:scale(4.2);opacity:0}}',
        'html.evm #mainColumn a.button:active,html.evm #mainColumn .sub:active,html.evm #mainColumn .add:active,html.evm #evm-nav button:active{transform:scale(.95)}',
        '@media (prefers-reduced-motion:reduce){.evm-ripple{display:none}}',

        /* Time (game speed) control in the top bar, with its popup. */
        'html.evm .topBar .planetWrap{order:0}',
        'html.evm .topBar .calendar{order:2;flex:1 1 100%!important}',
        '#evm-speed{order:1;margin-left:auto;appearance:none;-webkit-appearance:none;border:1px solid rgba(255,255,255,.45);border-radius:.4rem;background:rgba(0,0,0,.25);color:inherit;font:inherit;font-size:.85rem;line-height:1.1rem;padding:.1rem .5rem;margin-top:.1rem;margin-bottom:.1rem;cursor:pointer;touch-action:manipulation}',
        '#evm-speed.fast{background:#f1fa8c;color:#222;border-color:#f1fa8c;font-weight:600}',
        '#evm-speed-panel{position:fixed;right:.5rem;z-index:35;width:min(20rem,calc(100vw - 1rem));box-sizing:border-box;padding:.75rem;border:1px solid rgba(128,128,128,.5);border-radius:.6rem;background:rgba(20,20,22,.97);color:#eee;box-shadow:0 .25rem 1rem rgba(0,0,0,.6);font-size:.9rem}',
        '#evm-speed-panel h3{margin:0 0 .5rem;font-size:1rem;color:#f1fa8c}',
        '#evm-speed-panel .row{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.6rem}',
        '#evm-speed-panel button,#evm-speed-panel input{font:inherit;font-size:1rem;box-sizing:border-box;border:1px solid rgba(128,128,128,.6);border-radius:.4rem;background:#33343a;color:#eee;padding:.45rem .7rem;min-height:2.4rem}',
        '#evm-speed-panel button.on{background:#f1fa8c;color:#222;border-color:#f1fa8c;font-weight:600}',
        '#evm-speed-panel input{width:5.5rem;background:#f4f4ee;color:#222}',
        '#evm-speed-panel p{margin:.4rem 0 0;color:#aaa;font-size:.8rem;line-height:1.3}',

        /* Bottom navigation. */
        '#evm-nav{display:none}',
        'html.evm #evm-nav{display:flex;flex-direction:column;flex:none;border-top:1px solid rgba(128,128,128,.5);background:#2b2b2b;padding-bottom:env(safe-area-inset-bottom);position:relative;z-index:11}',
        '#evm-nav .evm-btns{display:flex}',
        '#evm-nav button{flex:1 1 0;appearance:none;-webkit-appearance:none;background:transparent;border:0;border-bottom:3px solid transparent;color:#cfcfcf;font:inherit;font-size:1rem;padding:.85rem .25rem;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
        '#evm-nav button.on{color:#fff;border-bottom-color:#f1fa8c;background:rgba(255,255,255,.08)}',
        '#evm-nav button.evm-mult{flex:0 0 auto;min-width:4.2rem;color:#aaa;font-size:.95rem}',
        '#evm-nav button.evm-mult.mult-on{color:#222;background:#f1fa8c;border-bottom-color:#f1fa8c;font-weight:600}'
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
    var ticker = document.createElement('div');
    ticker.id = NS + '-ticker';
    ticker.setAttribute('aria-hidden', 'true'); // the game's own log is already a live region
    var tickerMsg = document.createElement('span');
    tickerMsg.className = 'msg';
    ticker.appendChild(tickerMsg);
    nav.appendChild(ticker);
    var btns = document.createElement('div');
    btns.className = 'evm-btns';
    nav.appendChild(btns);
    VIEWS.forEach(function (v) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = v.label;
        b.setAttribute('role', 'tab');
        b.addEventListener('click', function () { show(v.id); });
        btns.appendChild(b);
        buttons[v.id] = b;
    });
    var multBtn = document.createElement('button');
    multBtn.type = 'button';
    multBtn.className = 'evm-mult';
    multBtn.title = 'Step multiplier for the \u00ab \u00bb and build buttons (like Ctrl / Shift / Alt on a PC)';
    multBtn.addEventListener('click', function () { cycleMult(); });
    btns.appendChild(multBtn);

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
        if (id === 'log') { clearTicker(); } // the Log panel shows the messages itself
        syncScene();
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

    /* Message log -> ticker in the bottom bar. The game prepends <p class="has-text-COLOR"> to #msgQueueLog for each new message. */
    var logObs, boundLog, muteUntil = 0;
    var TOAST_MAX = 3, tickQueue = [], tickBusy = false, tickTimer;

    ticker.addEventListener('click', function () { tickQueue = []; show('log'); });

    function showToast(text, color) {
        if (!active || current === 'log' || !text) { return; }
        var last = tickQueue[tickQueue.length - 1];
        if (last && last.t === text) { return; }
        tickQueue.push({ t: text, c: color || 'has-text-warning' });
        if (tickQueue.length > 6) { tickQueue.shift(); }
        fx.pulse(color);
        if (!tickBusy) { nextTick(); }
    }

    function nextTick() {
        var m = tickQueue.shift();
        ticker.classList.remove('live');
        if (!m) { tickBusy = false; return; }
        tickBusy = true;
        tickerMsg.className = 'msg ' + m.c;
        tickerMsg.textContent = m.t;
        void ticker.offsetWidth; // restart the slide-in
        ticker.classList.add('live');
        var ms = tickQueue.length > 2 ? 1500 : Math.min(7000, 2500 + m.t.length * 45);
        tickTimer = setTimeout(function () {
            ticker.classList.remove('live');
            tickTimer = setTimeout(nextTick, 280);
        }, ms);
    }

    function clearTicker() {
        clearTimeout(tickTimer);
        tickQueue = [];
        tickBusy = false;
        ticker.classList.remove('live');
    }

    function onLogChange(muts) {
        if (!active || Date.now() < muteUntil) { return; }
        var added = [];
        muts.forEach(function (m) {
            [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1 && n.tagName === 'P') { added.push(n); } });
        });
        // A filter switch / clear / startup restore re-adds many lines at once: not new messages.
        if (!added.length || added.length > TOAST_MAX) { return; }
        added.forEach(function (n) {
            var m = /(?:^|\s)(has-text-[a-z-]+)/.exec(n.className || '');
            showToast(n.textContent, m ? m[1] : '');
        });
    }

    function bindLog() {
        var log = document.getElementById('msgQueueLog');
        if (log === boundLog) { return; }
        if (logObs) { logObs.disconnect(); }
        boundLog = log;
        if (log) {
            muteUntil = Date.now() + 1500; // the game fills a fresh log with saved messages
            logObs = new MutationObserver(onLogChange);
            logObs.observe(log, { childList: true });
        }
    }

    function muteOnLogControls(e) {
        if (e.target.closest && e.target.closest('#msgQueue')) { muteUntil = Date.now() + 700; }
    }

    /* Step multiplier: the game reads Ctrl / Shift / Alt (x10 / x25 / x100) from keyboard events, so emulate them.
       The game also clears those flags on every mouse move (which a tap generates), so re-assert them around each tap. */
    var MULTS = [
        { label: '\u00d71', keys: [] },
        { label: '\u00d710', keys: ['Control'] },
        { label: '\u00d725', keys: ['Shift'] },
        { label: '\u00d7100', keys: ['Alt'] }
    ];
    var multIdx = 0;

    function fireKeys(type) {
        MULTS[multIdx].keys.forEach(function (k) {
            document.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true, cancelable: true }));
        });
    }

    function holdMult() { if (active && multIdx) { fireKeys('keydown'); } }

    function afterTap() { setTimeout(holdMult, 0); }

    function cycleMult() {
        fireKeys('keyup');
        multIdx = (multIdx + 1) % MULTS.length;
        holdMult();
        renderMult();
    }

    function renderMult() {
        multBtn.textContent = MULTS[multIdx].label;
        multBtn.classList.toggle('mult-on', multIdx > 0);
    }

    /* Game speed: the game's clock is a Web Worker timer started with { loop: 'start', period } (250ms normally; the game
       itself halves it for "accelerated time"). Scaling that period scales game time. */
    var speed = 1, basePeriod = 250, workerRef = null, origPost = null, tickTimes = [], lastTick = null;
    var speedBtn, speedPanel, speedInput;

    function patchWorker() {
        if (origPost || !window.Worker || !Worker.prototype.postMessage) { return; }
        // (1) Intercept the game's (re)starts of its clock so a chosen speed also applies after the game restarts it itself.
        origPost = Worker.prototype.postMessage;
        Worker.prototype.postMessage = function (msg) {
            workerRef = this;
            if (msg && msg.loop === 'start' && typeof msg.period === 'number') {
                basePeriod = msg.period;
                if (speed !== 1) { msg = { loop: msg.loop, period: scaledPeriod() }; }
            }
            return origPost.apply(this, [msg].concat([].slice.call(arguments, 1)));
        };
        // (2) The clock's ticks arrive as message events whose target is the worker: grab it (and the tick interval) from there.
        var d = Object.getOwnPropertyDescriptor(MessageEvent.prototype, 'data');
        if (d && d.get) {
            Object.defineProperty(MessageEvent.prototype, 'data', {
                configurable: true,
                enumerable: d.enumerable,
                get: function () {
                    var v = d.get.call(this);
                    if (v && v.loop === 'main' && this.target instanceof Worker) {
                        if (!workerRef) { workerRef = this.target; }
                        if (this !== lastTick) { // a message's data can be read several times (by the game and by other scripts)
                            lastTick = this;
                            tickTimes.push(Date.now());
                            if (tickTimes.length > 12) { tickTimes.shift(); }
                        }
                    }
                    return v;
                }
            });
        }
    }

    function scaledPeriod() { return Math.max(1, Math.round(basePeriod / speed)); }

    /* Current un-scaled tick length, measured from recent ticks (the game uses 250ms, 125ms in accelerated time, ...). */
    function measuredPeriod() {
        if (tickTimes.length < 6) { return basePeriod; }
        var gaps = [];
        for (var i = 1; i < tickTimes.length; i++) { gaps.push(tickTimes[i] - tickTimes[i - 1]); }
        gaps.sort(function (a, b) { return a - b; });
        var m = gaps[Math.floor(gaps.length / 2)];
        return (m >= 40 && m <= 1000) ? m : basePeriod; // implausible (e.g. throttled background tab): keep the last known value
    }

    function gamePaused() {
        var el = document.getElementById('pausegame');
        return !!el && el.classList.contains('pause');
    }

    function applySpeed(tries) {
        if (gamePaused()) { return; } // the game restarts its clock (through our patch) when it is resumed
        if (!workerRef) {
            if (tries > 0) { setTimeout(function () { applySpeed(tries - 1); }, 100); }
            return;
        }
        origPost.call(workerRef, { loop: 'clear' });
        origPost.call(workerRef, { loop: 'start', period: scaledPeriod() });
        tickTimes = [];
    }

    function setSpeed(v) {
        v = Math.min(100, Math.max(0.25, Number(v) || 1));
        patchWorker();
        if (speed === 1) { basePeriod = measuredPeriod(); } // only measurable while the clock is unscaled
        speed = v;
        renderSpeed();
        applySpeed(30);
    }

    function fmtSpeed(v) { return '\u00d7' + (Math.round(v * 100) / 100); }

    function renderSpeed() {
        if (!speedBtn) { return; }
        speedBtn.textContent = '\u23e9 ' + fmtSpeed(speed);
        speedBtn.classList.toggle('fast', speed !== 1);
        if (speedPanel) {
            [].forEach.call(speedPanel.querySelectorAll('button[data-v]'), function (b) {
                b.classList.toggle('on', Number(b.getAttribute('data-v')) === speed);
            });
            if (speedInput && document.activeElement !== speedInput) { speedInput.value = speed; }
        }
    }

    function closeSpeedPanel() { if (speedPanel) { speedPanel.remove(); speedPanel = speedInput = null; } }

    function openSpeedPanel() {
        closeSpeedPanel();
        speedPanel = document.createElement('div');
        speedPanel.id = NS + '-speed-panel';
        var h = document.createElement('h3');
        h.textContent = 'Game speed';
        speedPanel.appendChild(h);
        var row = document.createElement('div');
        row.className = 'row';
        [1, 2, 5, 10, 25, 50, 100].forEach(function (v) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = fmtSpeed(v);
            b.setAttribute('data-v', v);
            b.addEventListener('click', function () { setSpeed(v); });
            row.appendChild(b);
        });
        speedPanel.appendChild(row);
        var custom = document.createElement('div');
        custom.className = 'row';
        speedInput = document.createElement('input');
        speedInput.type = 'number';
        speedInput.min = '0.25';
        speedInput.max = '100';
        speedInput.step = 'any';
        speedInput.setAttribute('inputmode', 'decimal');
        speedInput.setAttribute('aria-label', 'Custom speed multiplier');
        var set = document.createElement('button');
        set.type = 'button';
        set.textContent = 'Set';
        set.addEventListener('click', function () { setSpeed(speedInput.value); });
        speedInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { setSpeed(speedInput.value); } });
        custom.appendChild(speedInput);
        custom.appendChild(set);
        speedPanel.appendChild(custom);
        var note = document.createElement('p');
        note.textContent = 'Speeds up the game clock (0.25\u2013100\u00d7). High values are limited by how fast your device can keep up, and the speed resets when the page reloads.';
        speedPanel.appendChild(note);
        var vh = document.createElement('h3');
        vh.textContent = 'Visuals';
        vh.style.marginTop = '.8rem';
        speedPanel.appendChild(vh);
        var vrow = document.createElement('div');
        vrow.className = 'row';
        [['scene', 'Scene'], ['fx', 'Effects']].forEach(function (o) {
            var b = document.createElement('button');
            b.type = 'button';
            var label = function () { b.textContent = o[1] + ': ' + (opts[o[0]] ? 'on' : 'off'); b.classList.toggle('on', !!opts[o[0]]); };
            label();
            b.addEventListener('click', function () { setOpt(o[0], !opts[o[0]]); label(); });
            vrow.appendChild(b);
        });
        speedPanel.appendChild(vrow);
        document.body.appendChild(speedPanel);
        var bar = document.getElementById('topBar');
        speedPanel.style.top = (bar ? bar.getBoundingClientRect().bottom + 4 : 40) + 'px';
        renderSpeed();
    }

    function onDocTap(e) {
        // (ignore the click we send to the game's pause button ourselves: it is not a user tap)
        if (e.isTrusted && speedPanel && !speedPanel.contains(e.target) && e.target !== speedBtn) { closeSpeedPanel(); }
    }

    function attachSpeedBtn() {
        var bar = document.getElementById('topBar');
        if (!bar) { return; }
        if (!speedBtn) {
            speedBtn = document.createElement('button');
            speedBtn.type = 'button';
            speedBtn.id = NS + '-speed';
            speedBtn.title = 'Game speed';
            speedBtn.addEventListener('click', function () { speedPanel ? closeSpeedPanel() : openSpeedPanel(); });
            renderSpeed();
        }
        if (speedBtn.parentNode !== bar) { bar.appendChild(speedBtn); }
    }

    /* ---- Visuals: a small animated 2D scene above the tabs + tap ripples + sparks. ----
       The scene reads the game's own top bar (season, weather, day counter) and building badges; it never touches game state. */
    var opts = { scene: true, fx: true };
    var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    try {
        var saved = JSON.parse(localStorage.getItem(NS + '-opts') || 'null');
        if (saved) { opts.scene = saved.scene !== false; opts.fx = saved.fx !== false; }
        else if (reduced) { opts.fx = false; }
    } catch (e) { /* storage unavailable: defaults */ }

    function setOpt(k, v) {
        opts[k] = v;
        try { localStorage.setItem(NS + '-opts', JSON.stringify(opts)); } catch (e) { /* ignore */ }
        syncScene();
    }

    var SH = 58; // scene height in px
    var scene = {
        el: null, cv: null, cx: null, w: 0, dpr: 1, raf: 0, last: 0, t: 0,
        phase: 0.15, dayLen: 5000, dayNum: null, dayStamps: [], lastEnv: 0, over: {},
        season: 'summer', weather: 'clear', total: 0, clouds: [], parts: [], folk: [], flash: 0, seed: 7
    };

    function rng(seed) { // small deterministic PRNG so the village looks the same every time
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function mixc(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
    function rgb(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')'; }

    var SKY = [ // phase -> [top, bottom]
        [0.00, [59, 74, 122], [242, 182, 154]],
        [0.10, [79, 143, 214], [191, 227, 245]],
        [0.40, [61, 139, 224], [169, 216, 245]],
        [0.60, [74, 134, 200], [243, 201, 139]],
        [0.70, [58, 47, 107], [238, 138, 90]],
        [0.80, [11, 17, 48], [29, 43, 90]],
        [0.95, [15, 23, 54], [42, 58, 110]],
        [1.00, [59, 74, 122], [242, 182, 154]]
    ];
    function skyAt(p) {
        for (var i = 1; i < SKY.length; i++) {
            if (p <= SKY[i][0]) {
                var a = SKY[i - 1], b = SKY[i], t = (p - a[0]) / (b[0] - a[0]);
                return [mixc(a[1], b[1], t), mixc(a[2], b[2], t)];
            }
        }
        return [SKY[0][1], SKY[0][2]];
    }
    function nightAt(p) {
        if (p < 0.08) { return 0.5 * (1 - p / 0.08); }
        if (p < 0.62) { return 0; }
        if (p < 0.78) { return (p - 0.62) / 0.16; }
        if (p < 0.94) { return 1; }
        return 1 - 0.5 * ((p - 0.94) / 0.06);
    }
    var GROUND = { spring: [90, 168, 74], summer: [76, 154, 60], autumn: [167, 122, 47], winter: [233, 238, 245] };
    var LEAF = { spring: [110, 190, 90], summer: [46, 125, 50], autumn: [214, 120, 40], winter: [235, 240, 248] };

    function readEnv() {
        var now = Date.now(), o = scene.over;
        // day counter -> length of a game day (drives the sun)
        var dEl = document.querySelector('#topBar .calendar .day');
        var m = dEl && /\d+/.exec(dEl.textContent || '');
        var started = !!(dEl && dEl.offsetParent && m);
        if (m && m[0] !== scene.dayNum) {
            if (scene.dayNum !== null) {
                scene.dayStamps.push(now);
                if (scene.dayStamps.length > 7) { scene.dayStamps.shift(); }
                if (scene.dayStamps.length > 2) {
                    var g = [];
                    for (var i = 1; i < scene.dayStamps.length; i++) { g.push(scene.dayStamps[i] - scene.dayStamps[i - 1]); }
                    g.sort(function (a, b) { return a - b; });
                    scene.dayLen = Math.min(60000, Math.max(2500, g[g.length >> 1]));
                }
            }
            scene.dayNum = m[0];
            scene.dayChanged = now;
        }
        scene.started = o.started != null ? o.started : started;
        var sEl = document.querySelector('#topBar .calendar .season');
        var st = ((sEl && sEl.textContent) || '').toLowerCase();
        scene.season = o.season || (/spring/.test(st) ? 'spring' : /autumn|fall/.test(st) ? 'autumn' : /winter/.test(st) ? 'winter' : 'summer');
        var wEl = document.getElementById('weather'), wc = (wEl && wEl.className) || '';
        scene.weather = o.weather || (/snow/.test(wc) ? 'snow' : /storm/.test(wc) ? 'storm' : /rain|showers/.test(wc) ? 'rain' : /cloud/.test(wc) ? 'cloudy' : /wind|gust/.test(wc) ? 'windy' : 'clear');
        var badges = document.querySelectorAll('#city [id^="city-"] .count');
        if (badges.length) {
            var tot = 0;
            for (var j = 0; j < badges.length; j++) { tot += parseInt(badges[j].textContent, 10) || 0; }
            scene.total = tot;
        }
        if (o.total != null) { scene.total = o.total; }
        scene.paused = gamePaused() || (scene.dayChanged && now - scene.dayChanged > scene.dayLen * 4);
    }

    function layout() {
        var el = scene.el, w = el.clientWidth;
        if (!w || w === scene.w) { return; }
        scene.w = w;
        scene.dpr = Math.min(2, window.devicePixelRatio || 1);
        scene.cv.width = Math.round(w * scene.dpr);
        scene.cv.height = Math.round(SH * scene.dpr);
        var r = rng(scene.seed);
        scene.clouds = [];
        for (var i = 0; i < 6; i++) { scene.clouds.push({ x: r() * w, y: 4 + r() * 20, s: 0.7 + r() * 0.9, v: 2 + r() * 4 }); }
        scene.stars = [];
        for (var k = 0; k < 28; k++) { scene.stars.push({ x: r() * w, y: r() * (SH - 22), p: r() * 6.28 }); }
    }

    function draw(dt) {
        var cx = scene.cx, w = scene.w, h = SH, gy = h - 12, p = scene.phase, sec = dt / 1000;
        var night = nightAt(p), season = scene.season, wx = scene.weather;
        cx.setTransform(scene.dpr, 0, 0, scene.dpr, 0, 0);
        // sky
        var sky = skyAt(p), gray = wx === 'storm' ? 0.55 : (wx === 'rain' || wx === 'snow') ? 0.38 : wx === 'cloudy' ? 0.22 : 0;
        var top = mixc(sky[0], [110, 116, 128], gray * (1 - night * 0.6)), bot = mixc(sky[1], [150, 156, 166], gray * (1 - night * 0.6));
        if (season === 'winter') { top = mixc(top, [200, 212, 232], 0.18); bot = mixc(bot, [225, 232, 244], 0.2); }
        if (season === 'autumn') { bot = mixc(bot, [240, 170, 100], 0.15); }
        var g = cx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, rgb(top)); g.addColorStop(1, rgb(bot));
        cx.fillStyle = g; cx.fillRect(0, 0, w, h);
        // stars
        if (night > 0.35 && wx !== 'storm') {
            for (var i = 0; i < scene.stars.length; i++) {
                var st = scene.stars[i];
                cx.fillStyle = 'rgba(255,255,255,' + ((night - 0.3) * (0.5 + 0.5 * Math.sin(scene.t / 500 + st.p)) * (1 - gray)).toFixed(2) + ')';
                cx.fillRect(st.x, st.y, 1.3, 1.3);
            }
        }
        // sun / moon
        var u;
        if (p >= 0.02 && p <= 0.68) {
            u = (p - 0.02) / 0.66;
            var sx = w * (0.06 + 0.88 * u), sy = gy - Math.sin(Math.PI * u) * (h * 0.62) + 2, low = 1 - Math.sin(Math.PI * u);
            var sg = cx.createRadialGradient(sx, sy, 1, sx, sy, 20);
            sg.addColorStop(0, 'rgba(255,236,160,' + (0.55 * (1 - gray)).toFixed(2) + ')'); sg.addColorStop(1, 'rgba(255,236,160,0)');
            cx.fillStyle = sg; cx.beginPath(); cx.arc(sx, sy, 20, 0, 6.3); cx.fill();
            cx.fillStyle = rgb(mixc([255, 224, 120], [255, 140, 70], Math.min(1, low * 1.4)), 1 - gray * 0.6);
            cx.beginPath(); cx.arc(sx, sy, 6, 0, 6.3); cx.fill();
        }
        var pm = p < 0.5 ? p + 1 : p;
        if (pm >= 0.66 && pm <= 1.04) {
            u = (pm - 0.66) / 0.38;
            var mx = w * (0.06 + 0.88 * u), my = gy - Math.sin(Math.PI * u) * (h * 0.6) + 2;
            cx.fillStyle = 'rgba(235,240,255,' + (0.95 * (1 - gray * 0.7)).toFixed(2) + ')';
            cx.beginPath(); cx.arc(mx, my, 5, 0, 6.3); cx.fill();
            cx.fillStyle = rgb(mixc(top, bot, 0.3));
            cx.beginPath(); cx.arc(mx + 2.2, my - 1, 4.3, 0, 6.3); cx.fill();
        }
        // clouds
        var nCl = wx === 'clear' ? 3 : wx === 'windy' ? 5 : 6, wind = (wx === 'windy' || wx === 'storm') ? 3 : 1;
        var cc = mixc([255, 255, 255], [90, 96, 110], Math.max(night * 0.8, wx === 'storm' ? 0.7 : wx === 'rain' ? 0.45 : 0));
        for (var c = 0; c < nCl; c++) {
            var cl = scene.clouds[c];
            if (!scene.paused) { cl.x += cl.v * wind * sec; if (cl.x > w + 30) { cl.x = -30; } }
            cx.fillStyle = rgb(cc, 0.55 + 0.25 * (1 - night));
            for (var b = 0; b < 3; b++) {
                cx.beginPath(); cx.ellipse(cl.x + b * 9 * cl.s, cl.y + (b === 1 ? -3 : 0), 11 * cl.s, 6 * cl.s, 0, 0, 6.3); cx.fill();
            }
        }
        // back hills + ground
        var gc = mixc(GROUND[season], [10, 20, 30], night * 0.55);
        cx.fillStyle = rgb(mixc(gc, [0, 0, 0], 0.18));
        cx.beginPath(); cx.moveTo(0, h);
        for (var x = 0; x <= w; x += 8) { cx.lineTo(x, gy - 4 + Math.sin(x / 38) * 3 + Math.sin(x / 15) * 1.2); }
        cx.lineTo(w, h); cx.fill();
        cx.fillStyle = rgb(gc); cx.fillRect(0, gy + 2, w, h - gy);
        // trees
        var r = rng(scene.seed + 3), nTr = 5 + Math.min(9, Math.floor(scene.total / 12)), leaf = mixc(LEAF[season], [10, 25, 30], night * 0.5);
        for (var t = 0; t < nTr; t++) {
            var tx = r() * w, ts = 0.8 + r() * 0.7, sway = Math.sin(scene.t / 900 + t) * (wx === 'windy' || wx === 'storm' ? 1.6 : 0.5);
            cx.fillStyle = rgb(mixc([90, 60, 35], [10, 10, 10], night * 0.6)); cx.fillRect(tx - 0.8, gy - 2 * ts + 3, 1.6, 5 * ts);
            cx.fillStyle = rgb(leaf);
            cx.beginPath(); cx.moveTo(tx - 5 * ts, gy + 2); cx.lineTo(tx + sway, gy - 11 * ts); cx.lineTo(tx + 5 * ts, gy + 2); cx.fill();
        }
        // village: houses grow with the number of buildings
        var nH = Math.min(16, 1 + Math.floor(Math.sqrt(scene.total) * 1.3)), hr = rng(scene.seed + 11), smokers = 0;
        for (var hI = 0; hI < nH; hI++) {
            var slot = (hI * 0.618034 % 1) * (w - 24) + 6, hw = 9 + hr() * 6, hh = 6 + hr() * 5, hcol = hr();
            var wall = mixc(hcol < 0.33 ? [196, 160, 120] : hcol < 0.66 ? [176, 126, 98] : [208, 196, 170], [20, 24, 40], night * 0.55);
            cx.fillStyle = rgb(wall); cx.fillRect(slot, gy + 3 - hh, hw, hh);
            cx.fillStyle = rgb(mixc(season === 'winter' ? [240, 244, 250] : [140, 60, 50], [20, 14, 20], night * 0.5));
            cx.beginPath(); cx.moveTo(slot - 1.5, gy + 3 - hh); cx.lineTo(slot + hw / 2, gy - hh - 4); cx.lineTo(slot + hw + 1.5, gy + 3 - hh); cx.fill();
            cx.fillStyle = night > 0.45 ? 'rgba(255,214,110,' + Math.min(1, night + 0.2) + ')' : 'rgba(40,50,70,.7)';
            cx.fillRect(slot + hw * 0.55, gy + 3 - hh * 0.75, 2.4, 2.4);
            cx.fillStyle = rgb(mixc([90, 60, 40], [10, 10, 14], night * 0.6)); cx.fillRect(slot + hw * 0.2, gy + 3 - 4, 2.2, 4);
            if (smokers < 4 && (season === 'winter' || night > 0.5) && !scene.paused && opts.fx && Math.random() < sec * 0.9) {
                scene.parts.push({ k: 'smoke', x: slot + hw * 0.75, y: gy - hh - 4, vx: 3 + Math.random() * 3, vy: -9 - Math.random() * 4, l: 1.6, m: 1.6 });
            }
            smokers++;
        }
        // villagers
        var nF = Math.min(7, Math.floor(nH / 2));
        while (scene.folk.length < nF) { scene.folk.push({ x: Math.random() * w, d: Math.random() < 0.5 ? -1 : 1, v: 5 + Math.random() * 6, c: Math.random() }); }
        if (night < 0.7) {
            for (var f = 0; f < nF; f++) {
                var fo = scene.folk[f];
                if (!scene.paused) { fo.x += fo.d * fo.v * sec; if (fo.x < 4 || fo.x > w - 4) { fo.d = -fo.d; } }
                cx.fillStyle = rgb(mixc(fo.c < 0.5 ? [70, 110, 170] : [170, 70, 70], [10, 10, 20], night * 0.6));
                cx.fillRect(fo.x - 1, gy + 0.5 + Math.abs(Math.sin(scene.t / 120 + f)) * -0.8, 2, 4);
                cx.fillStyle = 'rgba(240,210,180,' + (1 - night) + ')'; cx.fillRect(fo.x - 0.9, gy - 1.5 + Math.abs(Math.sin(scene.t / 120 + f)) * -0.8, 1.8, 1.8);
            }
        }
        // weather particles + smoke + sparks
        var want = wx === 'rain' ? 46 : wx === 'storm' ? 80 : wx === 'snow' ? 40 : 0, have = 0, i2;
        for (i2 = 0; i2 < scene.parts.length; i2++) { if (scene.parts[i2].k === 'wx') { have++; } }
        for (var sp = have; sp < want && !scene.paused; sp++) {
            scene.parts.push({ k: 'wx', x: Math.random() * w, y: -Math.random() * 20, vx: wx === 'snow' ? (Math.random() - 0.5) * 8 : (wx === 'storm' ? -26 : -9), vy: wx === 'snow' ? 14 + Math.random() * 10 : 90 + Math.random() * 40, s: wx });
        }
        for (i2 = scene.parts.length - 1; i2 >= 0; i2--) {
            var q = scene.parts[i2];
            if (q.k === 'wx') {
                if (!scene.paused) { q.x += q.vx * sec; q.y += q.vy * sec; }
                if (q.y > gy + 4 || want === 0) { if (want === 0 || q.s !== wx) { scene.parts.splice(i2, 1); continue; } q.y = -2; q.x = Math.random() * w; }
                if (q.s === 'snow') { cx.fillStyle = 'rgba(255,255,255,.9)'; cx.beginPath(); cx.arc(q.x + Math.sin(scene.t / 400 + q.y) * 1.5, q.y, 1.2, 0, 6.3); cx.fill(); }
                else { cx.strokeStyle = 'rgba(190,210,255,.6)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(q.x, q.y); cx.lineTo(q.x + q.vx * 0.04, q.y + 6); cx.stroke(); }
            } else if (q.k === 'smoke') {
                q.l -= sec; q.x += q.vx * sec; q.y += q.vy * sec;
                if (q.l <= 0) { scene.parts.splice(i2, 1); continue; }
                cx.fillStyle = 'rgba(210,210,215,' + (0.4 * q.l / q.m).toFixed(2) + ')'; cx.beginPath(); cx.arc(q.x, q.y, 1.5 + (q.m - q.l) * 2, 0, 6.3); cx.fill();
            } else { // spark
                q.l -= sec; q.vy += 60 * sec; q.x += q.vx * sec; q.y += q.vy * sec;
                if (q.l <= 0) { scene.parts.splice(i2, 1); continue; }
                cx.fillStyle = q.c; cx.globalAlpha = Math.min(1, q.l * 2); cx.fillRect(q.x, q.y, 2, 2); cx.globalAlpha = 1;
            }
        }
        // lightning (storm) and event flash
        if (wx === 'storm' && Math.random() < sec * 0.25) { scene.flash = Math.max(scene.flash, 0.7); }
        if (scene.flash > 0.01) {
            cx.fillStyle = (scene.flashCol || 'rgba(255,255,255,') + (scene.flash * 0.45).toFixed(2) + ')'; cx.fillRect(0, 0, w, h);
            scene.flash *= Math.pow(0.02, sec);
        }
    }

    function sceneWanted() {
        return active && opts.scene && current === 'game' && !document.hidden && scene.started;
    }

    function frame(ts) {
        scene.raf = 0;
        if (!sceneWanted()) { return; }
        scene.raf = requestAnimationFrame(frame);
        var step = reduced ? 1000 : 33;
        if (ts - scene.last < step) { return; }
        var dt = Math.min(100, ts - (scene.last || ts - step));
        scene.last = ts;
        scene.t += dt;
        if (scene.over.phase != null) { scene.phase = scene.over.phase; }
        else if (!scene.paused && !reduced) { scene.phase = (scene.phase + dt / scene.dayLen) % 1; }
        if (ts - scene.lastEnv > 400) { scene.lastEnv = ts; readEnv(); }
        layout();
        if (scene.w) { draw(dt); }
    }

    function attachScene() {
        if (!scene.el) {
            scene.el = document.createElement('div');
            scene.el.id = NS + '-scene';
            scene.el.setAttribute('aria-hidden', 'true');
            scene.cv = document.createElement('canvas');
            scene.cx = scene.cv.getContext('2d');
            scene.el.appendChild(scene.cv);
            scene.el.addEventListener('click', function () { fx.pulse('has-text-warning'); }); // a little fun; hide it from the Visuals toggle
        }
        var cols = document.querySelector('.main>.columns');
        if (cols && scene.el.parentNode !== cols) { cols.appendChild(scene.el); scene.w = 0; }
    }

    function syncScene() {
        if (!active) { return; }
        attachScene();
        readEnv();
        var on = sceneWanted();
        html.classList.toggle(NS + '-scene-on', on);
        if (on && !scene.raf) { scene.raf = requestAnimationFrame(frame); }
    }

    /* Tap ripples + event sparks. */
    var PRESS = '#mainColumn a.button,#mainColumn .sub,#mainColumn .add,#mainColumn button,#mainColumn [role="button"],#evm-nav button';
    function onPress(e) {
        if (!active || !opts.fx || reduced || !e.target.closest || !e.target.closest(PRESS)) { return; }
        var r = document.createElement('span');
        r.className = NS + '-ripple';
        r.style.left = e.clientX + 'px';
        r.style.top = e.clientY + 'px';
        document.body.appendChild(r);
        setTimeout(function () { if (r.parentNode) { r.parentNode.removeChild(r); } }, 600);
    }

    var SPARK = { 'has-text-success': '#7cfc9a', 'has-text-danger': '#ff6b6b', 'has-text-warning': '#f1fa8c', 'has-text-info': '#8be9fd', 'has-text-advanced': '#ff9ef0', 'has-text-caution': '#ffb86c' };
    var fx = {
        pulse: function (color) {
            if (!opts.fx || reduced || !scene.raf || !scene.w) { return; }
            var col = SPARK[color] || '#ffd966', x = scene.w * (0.15 + Math.random() * 0.7);
            for (var i = 0; i < 16; i++) {
                scene.parts.push({ k: 'spark', x: x, y: SH - 16, vx: (Math.random() - 0.5) * 50, vy: -35 - Math.random() * 35, l: 0.7 + Math.random() * 0.6, c: col });
            }
            if (color === 'has-text-danger') { scene.flash = 0.8; scene.flashCol = 'rgba(255,60,60,'; } else { scene.flashCol = null; }
        }
    };

    var hintTimer;

    var api = window.__evm = {
        _scene: scene, // (test hook)
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
            hintTimer = setInterval(function () { updateHints(); bindLog(); attachSpeedBtn(); syncScene(); }, 750);
            document.addEventListener('pointerdown', onPress, true);
            document.addEventListener('visibilitychange', syncScene);
            document.addEventListener('mousemove', holdMult, false);
            document.addEventListener('mousedown', holdMult, true);
            document.addEventListener('click', holdMult, true);
            document.addEventListener('click', afterTap, false);
            document.addEventListener('click', onDocTap, true);
            patchWorker(); // passive until a speed is chosen; starts measuring the game's tick length
            attachSpeedBtn();
            renderMult();
            holdMult();
            document.addEventListener('click', muteOnLogControls, true);
            bindLog();
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
            document.removeEventListener('pointerdown', onPress, true);
            document.removeEventListener('visibilitychange', syncScene);
            if (scene.raf) { cancelAnimationFrame(scene.raf); scene.raf = 0; }
            html.classList.remove(NS + '-scene-on');
            if (scene.el) { scene.el.remove(); }
            fireKeys('keyup');
            multIdx = 0;
            document.removeEventListener('mousemove', holdMult, false);
            document.removeEventListener('mousedown', holdMult, true);
            document.removeEventListener('click', holdMult, true);
            document.removeEventListener('click', afterTap, false);
            document.removeEventListener('click', onDocTap, true);
            closeSpeedPanel();
            if (speed !== 1) { setSpeed(1); }
            if (speedBtn) { speedBtn.remove(); }
            document.removeEventListener('click', muteOnLogControls, true);
            if (logObs) { logObs.disconnect(); }
            boundLog = null;
            clearTicker();
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
