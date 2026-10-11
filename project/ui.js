(function (g) {
  if (g.PipUI) return;

  const NS = 'http://www.w3.org/2000/svg';
  const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const PATHS = {
    play: 'M8 5v14l11-7z',
    pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
    replay: 'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z',
    next: 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z',
    volUp: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
    volOff: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
    crop: 'M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z'
  };

  const CSS = `
html,body{margin:0;height:100%;background:#000;overflow:hidden}
.mp-root{position:fixed;inset:0;background:#000;color:#fff;font:12px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:hidden;user-select:none;-webkit-user-select:none}
.mp-root:not(.mp-show){cursor:none}
.mp-stage{position:absolute;inset:0}
.mp-stage video{position:absolute!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;transform:none!important;object-fit:contain!important;background:#000!important}
.mp-fill .mp-stage video{object-fit:cover!important}
.mp-caption{position:absolute;left:5%;right:5%;bottom:5%;text-align:center;pointer-events:none;font-size:clamp(12px,3.4vw,30px);font-weight:600;line-height:1.35;transition:bottom .15s}
.mp-show .mp-caption{bottom:84px}
.mp-caption div{margin-top:2px}
.mp-caption span{background:rgba(0,0,0,.75);padding:.05em .4em;border-radius:3px;-webkit-box-decoration-break:clone;box-decoration-break:clone;white-space:pre-wrap}
.mp-nocc .mp-caption{display:none}
.mp-msg{position:absolute;inset:0;display:none;align-items:center;justify-content:center;text-align:center;padding:16px;font-size:14px;color:#ddd;pointer-events:none;background:rgba(0,0,0,.55)}
.mp-msg.on{display:flex}
.mp-controls{position:absolute;left:0;right:0;bottom:0;padding:22px 8px 6px;background:linear-gradient(transparent,rgba(0,0,0,.88));opacity:0;transition:opacity .2s;pointer-events:none}
.mp-show .mp-controls{opacity:1;pointer-events:auto}
.mp-seek{display:block;width:100%;height:14px;margin:0 0 2px;padding:0;accent-color:#ff3b30;cursor:pointer}
.mp-row{display:flex;align-items:center;gap:2px}
.mp-sp{flex:1}
.mp-btn{background:none;border:0;color:#fff;padding:4px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;font:inherit;outline:0}
.mp-btn:hover{background:rgba(255,255,255,.2)}
.mp-btn.mp-off{opacity:.45}
.mp-txt{font-weight:700;min-width:30px;font-size:12px}
.mp-time{margin:0 6px;font-variant-numeric:tabular-nums;white-space:nowrap;opacity:.9}
.mp-vol{width:64px;margin:0 4px 0 0;accent-color:#fff;cursor:pointer}
@media (max-width:420px){.mp-vol{display:none}}
@media (max-width:330px){.mp-time{display:none}}
`;

  function el(doc, tag, cls) {
    const e = doc.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function icon(doc, name) {
    const s = doc.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('width', '22');
    s.setAttribute('height', '22');
    s.setAttribute('fill', 'currentColor');
    const path = (d, transform) => {
      const p = doc.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      if (transform) p.setAttribute('transform', transform);
      s.appendChild(p);
    };
    const label = (txt) => {
      const t = doc.createElementNS(NS, 'text');
      t.setAttribute('x', '12');
      t.setAttribute('y', '16');
      t.setAttribute('font-size', '7.5');
      t.setAttribute('font-weight', '700');
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-family', 'system-ui,sans-serif');
      t.textContent = txt;
      s.appendChild(t);
    };
    if (name === 'back') { path(PATHS.replay); label('10'); }
    else if (name === 'fwd') { path(PATHS.replay, 'translate(24 0) scale(-1 1)'); label('10'); }
    else path(PATHS[name]);
    return s;
  }

  function fmt(t) {
    if (!Number.isFinite(t) || t < 0) t = 0;
    t = Math.floor(t);
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    const ss = String(s).padStart(2, '0');
    return h ? h + ':' + String(m).padStart(2, '0') + ':' + ss : m + ':' + ss;
  }

  // opts: { doc, cmd(name, arg), resize(factor) }
  function create(opts) {
    const doc = opts.doc;
    const win = doc.defaultView;
    const cmd = opts.cmd;

    try {
      const sheet = new win.CSSStyleSheet();
      sheet.replaceSync(CSS);
      doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
    } catch (e) {
      const st = el(doc, 'style');
      st.textContent = CSS;
      doc.head.appendChild(st);
    }

    const root = el(doc, 'div', 'mp-root');
    const stage = el(doc, 'div', 'mp-stage');
    const caption = el(doc, 'div', 'mp-caption');
    const msg = el(doc, 'div', 'mp-msg');
    const controls = el(doc, 'div', 'mp-controls');
    root.append(stage, caption, msg, controls);
    doc.body.appendChild(root);

    let dragging = false;
    let hideTimer = 0;
    let lastCaption = '';
    let state = { rate: 1 };

    const btn = (name, title, act) => {
      const b = el(doc, 'button', 'mp-btn');
      b.type = 'button';
      b.title = title;
      if (name) b.appendChild(icon(doc, name));
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        act();
        b.blur();
      });
      return b;
    };
    const setIcon = (b, name) => b.replaceChildren(icon(doc, name));

    const seek = el(doc, 'input', 'mp-seek');
    seek.type = 'range';
    seek.min = '0';
    seek.max = '1000';
    seek.value = '0';
    seek.addEventListener('input', () => {
      dragging = true;
      if (Number.isFinite(state.duration) && state.duration > 0) {
        cmd('seekTo', (seek.value / 1000) * state.duration);
      }
    });
    seek.addEventListener('change', () => {
      dragging = false;
      seek.blur();
    });

    const playBtn = btn('play', 'Play / Pause (Space)', () => cmd('toggle'));
    const backBtn = btn('back', 'Rewind 10s (←)', () => cmd('seek', -10));
    const fwdBtn = btn('fwd', 'Forward 10s (→)', () => cmd('seek', 10));
    const nextBtn = btn('next', 'Next video', () => cmd('next'));
    nextBtn.style.display = 'none';
    const time = el(doc, 'span', 'mp-time');
    const sp = el(doc, 'span', 'mp-sp');
    const muteBtn = btn('volUp', 'Mute (M)', () => cmd('mute'));
    const vol = el(doc, 'input', 'mp-vol');
    vol.type = 'range';
    vol.min = '0';
    vol.max = '100';
    vol.value = '100';
    vol.addEventListener('input', () => cmd('volume', vol.value / 100));
    vol.addEventListener('change', () => vol.blur());
    const rateBtn = btn(null, 'Playback speed', () => {
      const cur = state.rate || 1;
      const i = RATES.findIndex((r) => r > cur + 0.001);
      cmd('rate', i === -1 ? RATES[0] : RATES[i]);
    });
    rateBtn.classList.add('mp-txt');
    rateBtn.textContent = '1x';
    const ccBtn = btn(null, 'Subtitles on/off', () => {
      const off = root.classList.toggle('mp-nocc');
      ccBtn.classList.toggle('mp-off', off);
    });
    ccBtn.classList.add('mp-txt');
    ccBtn.textContent = 'CC';
    const cropBtn = btn('crop', 'Fill window / remove borders (C)', () => toggleFill());

    const row = el(doc, 'div', 'mp-row');
    row.append(backBtn, playBtn, fwdBtn, nextBtn, time, sp, muteBtn, vol, rateBtn, ccBtn, cropBtn);
    controls.append(seek, row);

    function toggleFill() {
      const on = root.classList.toggle('mp-fill');
      cropBtn.classList.toggle('mp-off', !on);
    }
    cropBtn.classList.add('mp-off');

    function showControls() {
      root.classList.add('mp-show');
      win.clearTimeout(hideTimer);
      hideTimer = win.setTimeout(() => root.classList.remove('mp-show'), 2500);
    }
    root.addEventListener('pointermove', showControls);
    root.addEventListener('pointerdown', showControls);
    root.addEventListener('mouseleave', () => {
      win.clearTimeout(hideTimer);
      root.classList.remove('mp-show');
    });
    stage.addEventListener('click', () => cmd('toggle'));
    showControls();

    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey) return;
      if (e.altKey) {
        if (e.code === 'KeyP') {
          e.preventDefault();
          cmd('close');
        }
        return;
      }
      let handled = true;
      switch (e.key) {
        case 'ArrowRight': cmd('seek', 10); break;
        case 'ArrowLeft': cmd('seek', -10); break;
        case 'ArrowUp': cmd('volumeBy', 0.1); break;
        case 'ArrowDown': cmd('volumeBy', -0.1); break;
        case ' ': cmd('toggle'); break;
        case 'm': case 'M': cmd('mute'); break;
        case 'e': case 'E': opts.resize(1.15); break;
        case 's': case 'S': opts.resize(1 / 1.15); break;
        case 'c': case 'C': toggleFill(); break;
        default: handled = false;
      }
      if (handled) {
        e.preventDefault();
        showControls();
      }
    };
    doc.addEventListener('keydown', onKey);

    function setCaption(text) {
      text = text || '';
      if (text === lastCaption) return;
      lastCaption = text;
      caption.replaceChildren();
      if (!text) return;
      for (const line of text.split('\n')) {
        if (!line) continue;
        const d = el(doc, 'div');
        const s = el(doc, 'span');
        s.textContent = line;
        d.appendChild(s);
        caption.appendChild(d);
      }
    }

    let wasPaused;
    let wasMuted;
    function update(s) {
      state = s;
      if (s.paused !== wasPaused) {
        wasPaused = s.paused;
        setIcon(playBtn, s.paused ? 'play' : 'pause');
      }
      const finite = Number.isFinite(s.duration) && s.duration > 0;
      seek.style.visibility = finite ? '' : 'hidden';
      if (finite && !dragging) seek.value = String(Math.round((s.time / s.duration) * 1000));
      time.textContent = finite ? fmt(s.time) + ' / ' + fmt(s.duration) : 'LIVE';
      const muted = !!s.muted || s.volume === 0;
      if (muted !== wasMuted) {
        wasMuted = muted;
        setIcon(muteBtn, muted ? 'volOff' : 'volUp');
      }
      if (doc.activeElement !== vol) vol.value = String(Math.round((s.muted ? 0 : s.volume) * 100));
      rateBtn.textContent = (s.rate || 1) + 'x';
      nextBtn.style.display = s.hasNext ? '' : 'none';
      setCaption(s.caption);
    }

    function showMessage(text) {
      msg.textContent = text || '';
      msg.classList.toggle('on', !!text);
    }

    function destroy() {
      win.clearTimeout(hideTimer);
      doc.removeEventListener('keydown', onKey);
      root.remove();
    }

    return { stage, update, showMessage, destroy };
  }

  g.PipUI = { create };
})(typeof window !== 'undefined' ? window : self);
