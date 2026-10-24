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

        /* Message toasts above the bottom nav. */
        '#evm-toasts{position:fixed;left:.5rem;right:.5rem;bottom:4rem;z-index:30;display:flex;flex-direction:column;align-items:stretch;pointer-events:none}',
        '#evm-toasts .evm-toast{pointer-events:auto;box-sizing:border-box;margin-top:.35rem;padding:.5rem .75rem;border:1px solid rgba(128,128,128,.45);border-radius:.5rem;background:rgba(20,20,22,.94);box-shadow:0 .15rem .6rem rgba(0,0,0,.5);font-size:.9rem;line-height:1.3;animation:evm-in .2s ease-out;transition:opacity .3s,transform .3s}',
        '#evm-toasts .evm-toast.evm-out{opacity:0;transform:translateY(.5rem)}',
        '@keyframes evm-in{from{opacity:0;transform:translateY(.5rem)}to{opacity:1;transform:none}}',

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
        'html.evm #evm-nav{display:flex;flex:none;border-top:1px solid rgba(128,128,128,.5);background:#2b2b2b;padding-bottom:env(safe-area-inset-bottom);position:relative;z-index:11}',
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
    VIEWS.forEach(function (v) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = v.label;
        b.setAttribute('role', 'tab');
        b.addEventListener('click', function () { show(v.id); });
        nav.appendChild(b);
        buttons[v.id] = b;
    });
    var multBtn = document.createElement('button');
    multBtn.type = 'button';
    multBtn.className = 'evm-mult';
    multBtn.title = 'Step multiplier for the \u00ab \u00bb and build buttons (like Ctrl / Shift / Alt on a PC)';
    multBtn.addEventListener('click', function () { cycleMult(); });
    nav.appendChild(multBtn);

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

    /* Message log -> toasts. The game prepends <p class="has-text-COLOR"> to #msgQueueLog for each new message. */
    var toastBox, logObs, boundLog, muteUntil = 0;
    var TOAST_MS = 5000, TOAST_MAX = 3;

    function showToast(text, color) {
        if (!active || current === 'log' || !text) { return; }
        if (!toastBox || toastBox.parentNode !== document.body) {
            toastBox = toastBox || document.createElement('div');
            toastBox.id = NS + '-toasts';
            toastBox.setAttribute('aria-hidden', 'true'); // the game's own log is already a live region
            document.body.appendChild(toastBox);
        }
        toastBox.style.bottom = (nav.offsetHeight + 8) + 'px';
        var last = toastBox.lastChild;
        if (last && last.getAttribute('data-t') === text) { // same message again: just keep it up longer
            clearTimeout(last._timer);
            last._timer = setTimeout(function () { dismiss(last); }, TOAST_MS);
            return;
        }
        var el = document.createElement('div');
        el.className = NS + '-toast';
        el.setAttribute('data-t', text);
        var span = document.createElement('span');
        span.className = color || 'has-text-warning';
        span.textContent = text;
        el.appendChild(span);
        el.addEventListener('click', function () { dismiss(el); });
        toastBox.appendChild(el);
        while (toastBox.children.length > TOAST_MAX) { toastBox.removeChild(toastBox.firstChild); }
        el._timer = setTimeout(function () { dismiss(el); }, TOAST_MS);
    }

    function dismiss(el) {
        clearTimeout(el._timer);
        el.classList.add(NS + '-out');
        setTimeout(function () { if (el.parentNode) { el.parentNode.removeChild(el); } }, 320);
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
            hintTimer = setInterval(function () { updateHints(); bindLog(); attachSpeedBtn(); }, 750);
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
            if (toastBox) { toastBox.remove(); }
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
