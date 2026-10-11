(() => {
  if (window.__pipx) return;

  const ADAPTERS = [
    {
      host: /(^|\.)youtube\.com$/,
      captions: ['.ytp-caption-segment'],
      next: ['.ytp-next-button']
    },
    {
      host: /(^|\.)netflix\.com$/,
      captions: ['.player-timedtext-text-container', '.player-timedtext'],
      next: ['[data-uia="next-episode-seamless-button"]', '[data-uia="control-next"]']
    },
    {
      host: /(^|\.)disneyplus\.com$/,
      captions: ['.dss-subtitle-renderer-line', '.hive-subtitle-renderer-line', '.dss-subtitle-renderer-cue'],
      next: ['[data-testid="next-episode-button"]', '[data-gv2elementkey="nextEpisodeButton"]', 'button[aria-label*="Next" i]']
    },
    {
      host: /(^|\.)(primevideo\.com|amazon\.[a-z.]+)$/,
      captions: ['.atvwebplayersdk-captions-text', '.atvwebplayersdk-captions-overlay span'],
      next: ['.atvwebplayersdk-nextupcard-button', '.atvwebplayersdk-nexttitle-button', '.atvwebplayersdk-next-button']
    }
  ];
  const adapter = ADAPTERS.find((a) => a.host.test(location.hostname)) || { captions: [], next: [] };

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const isShown = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';

  function collectVideos(root, out) {
    root.querySelectorAll('video').forEach((v) => out.push(v));
    for (const e of root.querySelectorAll('*')) {
      if (e.shadowRoot) collectVideos(e.shadowRoot, out);
    }
    return out;
  }

  function findVideo() {
    if (state.pip && state.pip.video.isConnected) return state.pip.video;
    let best = null;
    let bestScore = -1;
    for (const v of collectVideos(document, [])) {
      const r = v.getBoundingClientRect();
      const area = r.width * r.height;
      if (!v.videoWidth && area === 0) continue;
      const score = area + (!v.paused && !v.ended ? 1e7 : 0) + (v.videoWidth ? 1 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = v;
      }
    }
    return best;
  }

  function nextButton() {
    for (const sel of adapter.next) {
      const el = document.querySelector(sel);
      if (isShown(el)) return el;
    }
    return null;
  }

  function readCaption() {
    for (const sel of adapter.captions) {
      const lines = [];
      document.querySelectorAll(sel).forEach((n) => {
        const t = (n.innerText || n.textContent || '').trim();
        if (t) lines.push(t);
      });
      if (lines.length) return lines.join('\n');
    }
    return '';
  }

  function readState(v) {
    return {
      paused: v.paused,
      time: v.currentTime || 0,
      duration: v.duration,
      volume: v.volume,
      muted: v.muted,
      rate: v.playbackRate,
      hasNext: !!nextButton(),
      caption: readCaption()
    };
  }

  function applyCmd(v, name, arg) {
    switch (name) {
      case 'toggle': if (v.paused) v.play().catch(() => {}); else v.pause(); break;
      case 'play': v.play().catch(() => {}); break;
      case 'pause': v.pause(); break;
      case 'seek': v.currentTime = clamp(v.currentTime + arg, 0, Number.isFinite(v.duration) ? v.duration : Infinity); break;
      case 'seekTo': v.currentTime = Math.max(0, arg); break;
      case 'volume': v.volume = clamp(arg, 0, 1); if (arg > 0) v.muted = false; break;
      case 'volumeBy': v.volume = clamp(v.volume + arg, 0, 1); if (arg > 0) v.muted = false; break;
      case 'mute': v.muted = !v.muted; break;
      case 'rate': v.playbackRate = arg; break;
      case 'next': { const b = nextButton(); if (b) b.click(); break; }
    }
  }

  const state = { pip: null, sessions: new Map() };

  // ---------- single window: Document Picture-in-Picture ----------

  function toast(text) {
    const t = document.createElement('div');
    t.textContent = text;
    t.style.cssText = 'position:fixed;z-index:2147483647;left:50%;top:24px;transform:translateX(-50%);background:#111;color:#fff;padding:10px 16px;border-radius:8px;font:14px system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.5)';
    document.documentElement.appendChild(t);
    return t;
  }

  function waitForGesture() {
    const t = toast('Click anywhere on the page to open Picture-in-Picture');
    const go = () => {
      removeEventListener('pointerdown', go, true);
      removeEventListener('keydown', go, true);
      t.remove();
      openPip();
    };
    addEventListener('pointerdown', go, true);
    addEventListener('keydown', go, true);
    setTimeout(() => {
      removeEventListener('pointerdown', go, true);
      removeEventListener('keydown', go, true);
      t.remove();
    }, 8000);
  }

  async function openPip() {
    if (!('documentPictureInPicture' in window)) return 'unsupported';
    const video = findVideo();
    if (!video) return 'novideo';

    const saved = await chrome.storage.local.get('pipSize').then((r) => r.pipSize, () => null);
    const ar = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : 16 / 9;
    const width = saved && saved.width ? saved.width : 480;
    const height = saved && saved.height ? saved.height : Math.round(width / ar);

    let pw;
    try {
      pw = await documentPictureInPicture.requestWindow({ width, height });
    } catch (e) {
      if (e && e.name === 'NotAllowedError') {
        waitForGesture();
        return 'needs-gesture';
      }
      return 'error:' + (e && e.message);
    }
    mount(pw, video, ar);
    return 'opened';
  }

  function mount(pw, video, ar) {
    const marker = document.createComment('pip');
    const origParent = video.parentNode;
    origParent.insertBefore(marker, video);
    const wasPlaying = !video.paused;

    const ui = PipUI.create({
      doc: pw.document,
      cmd: (name, arg) => (name === 'close' ? pw.close() : applyCmd(video, name, arg)),
      resize: (f) => {
        const w = Math.round(pw.innerWidth * f);
        const h = Math.round(w / (video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : ar));
        pw.resizeTo(w + (pw.outerWidth - pw.innerWidth), h + (pw.outerHeight - pw.innerHeight));
      }
    });
    ui.stage.appendChild(video);
    if (wasPlaying && video.paused) video.play().catch(() => {});

    const tick = () => ui.update(readState(video));
    tick();
    const timer = setInterval(tick, 250);

    let saveTimer = 0;
    pw.addEventListener('resize', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        chrome.storage.local.set({ pipSize: { width: pw.innerWidth, height: pw.innerHeight } }).catch(() => {});
      }, 400);
    });

    pw.addEventListener('pagehide', () => {
      clearInterval(timer);
      clearTimeout(saveTimer);
      const playing = !video.paused;
      if (marker.isConnected) marker.parentNode.insertBefore(video, marker);
      else if (origParent.isConnected) origParent.appendChild(video);
      marker.remove();
      if (playing && video.paused) video.play().catch(() => {});
      state.pip = null;
    });

    state.pip = { win: pw, video };
  }

  async function toggle() {
    if (state.pip) {
      state.pip.win.close();
      return 'closed';
    }
    return openPip();
  }

  // ---------- multiple windows: video streamed to an extension window ----------

  function toPopup(msg) {
    return chrome.runtime.sendMessage(msg).then(() => true, () => false);
  }

  function probe() {
    const v = findVideo();
    if (!v) return null;
    const r = v.getBoundingClientRect();
    return {
      score: r.width * r.height + (!v.paused && !v.ended ? 1e7 : 0),
      w: v.videoWidth,
      h: v.videoHeight
    };
  }

  function capStop(sid) {
    const s = state.sessions.get(sid);
    if (!s) return;
    clearInterval(s.timer);
    try { s.pc.close(); } catch (e) { /* already closed */ }
    state.sessions.delete(sid);
  }

  function capStart(sid) {
    capStop(sid);
    const video = findVideo();
    if (!video) return toPopup({ type: 'mp-err', sid, error: 'No video found on this page.' });

    let stream;
    try {
      stream = video.captureStream();
    } catch (e) {
      return toPopup({ type: 'mp-err', sid, error: 'This video cannot be captured (protected content).' });
    }

    const pc = new RTCPeerConnection({ iceServers: [] });
    const sess = { pc, video, timer: 0, fails: 0, chain: Promise.resolve() };
    state.sessions.set(sid, sess);

    const addTrack = (track) => {
      if (track.kind === 'video' && !pc.getSenders().some((s) => s.track === track)) pc.addTrack(track, stream);
    };
    stream.getVideoTracks().forEach(addTrack);
    stream.addEventListener('addtrack', (e) => addTrack(e.track));
    stream.addEventListener('removetrack', (e) => {
      const sender = pc.getSenders().find((s) => s.track === e.track);
      if (sender) pc.removeTrack(sender);
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) toPopup({ type: 'mp-sig', sid, cand: e.candidate.toJSON() });
    };
    pc.onnegotiationneeded = async () => {
      try {
        await pc.setLocalDescription();
        toPopup({ type: 'mp-sig', sid, desc: pc.localDescription.toJSON() });
      } catch (e) { /* session closed */ }
    };

    const push = async () => {
      const ok = await toPopup({ type: 'mp-state', sid, state: { ...readState(video), title: document.title } });
      sess.fails = ok ? 0 : sess.fails + 1;
      if (sess.fails >= 5) capStop(sid);
    };
    sess.timer = setInterval(push, 400);
    push();
  }

  function onSignal(m) {
    const sess = state.sessions.get(m.sid);
    if (!sess) return;
    const pc = sess.pc;
    sess.chain = sess.chain.then(async () => {
      if (m.desc) {
        await pc.setRemoteDescription(m.desc);
        for (const sender of pc.getSenders()) {
          try {
            const p = sender.getParameters();
            if (!p.encodings || !p.encodings.length) p.encodings = [{}];
            p.encodings[0].maxBitrate = 8e6;
            p.degradationPreference = 'maintain-resolution';
            await sender.setParameters(p);
          } catch (e) { /* not supported */ }
        }
      } else if (m.cand) {
        await pc.addIceCandidate(m.cand);
      }
    }).catch(() => {});
  }

  chrome.runtime.onMessage.addListener((m) => {
    if (!m || typeof m !== 'object') return;
    switch (m.type) {
      case 'mp-cap-start': capStart(m.sid); break;
      case 'mp-cap-stop': capStop(m.sid); break;
      case 'mp-sig': onSignal(m); break;
      case 'mp-cmd': {
        const s = state.sessions.get(m.sid);
        if (s) applyCmd(s.video, m.name, m.arg);
        break;
      }
    }
  });

  window.__pipx = { toggle, probe };
})();
