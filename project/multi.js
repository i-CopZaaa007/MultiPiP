(async () => {
  const q = new URLSearchParams(location.search);
  const tabId = Number(q.get('tab'));
  const frameId = Number(q.get('frame'));
  const sid = q.get('sid');

  const me = await chrome.windows.getCurrent();
  const sendTab = (msg) => chrome.tabs.sendMessage(tabId, msg, { frameId }).catch(() => {});

  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;

  let ar = 16 / 9;
  let lastState = 0;
  let lastFrame = 0;
  let paused = false;
  let stalledShown = false;
  let ready = false;
  const startedAt = Date.now();

  const setInner = (w) => {
    const h = Math.round(w / ar);
    const dw = window.outerWidth - window.innerWidth;
    const dh = window.outerHeight - window.innerHeight;
    return chrome.windows.update(me.id, { width: Math.round(w + dw), height: h + dh }).catch(() => {});
  };

  const ui = PipUI.create({
    doc: document,
    cmd: (name, arg) => {
      if (name === 'close') window.close();
      else sendTab({ type: 'mp-cmd', sid, name, arg });
    },
    resize: (f) => setInner(window.innerWidth * f)
  });
  ui.stage.appendChild(video);
  ui.showMessage('Connecting…');

  // WebRTC receiver
  const pc = new RTCPeerConnection({ iceServers: [] });
  let chain = Promise.resolve();
  const enqueue = (fn) => { chain = chain.then(fn).catch(() => {}); };

  pc.ontrack = (e) => {
    video.srcObject = e.streams[0] || new MediaStream([e.track]);
    video.play().catch(() => {});
  };
  pc.onicecandidate = (e) => {
    if (e.candidate) sendTab({ type: 'mp-sig', sid, cand: e.candidate.toJSON() });
  };

  video.addEventListener('loadedmetadata', async () => {
    ar = video.videoWidth / video.videoHeight || ar;
    if (ready) return;
    ready = true;
    ui.showMessage(null);
    const saved = (await chrome.storage.local.get('multiSize')).multiSize;
    setInner((saved && saved.width) || window.innerWidth);
  });
  video.addEventListener('resize', () => {
    if (video.videoWidth && video.videoHeight) ar = video.videoWidth / video.videoHeight;
  });
  const frameLoop = () => {
    lastFrame = Date.now();
    video.requestVideoFrameCallback(frameLoop);
  };
  video.requestVideoFrameCallback(frameLoop);

  chrome.runtime.onMessage.addListener((m) => {
    if (!m || m.sid !== sid) return;
    if (m.type === 'mp-sig') {
      enqueue(async () => {
        if (m.desc) {
          await pc.setRemoteDescription(m.desc);
          if (m.desc.type === 'offer') {
            await pc.setLocalDescription(await pc.createAnswer());
            sendTab({ type: 'mp-sig', sid, desc: pc.localDescription.toJSON() });
          }
        } else if (m.cand) {
          await pc.addIceCandidate(m.cand);
        }
      });
    } else if (m.type === 'mp-state') {
      lastState = Date.now();
      paused = m.state.paused;
      if (m.state.title) document.title = m.state.title;
      ui.update(m.state);
    } else if (m.type === 'mp-err') {
      ui.showMessage(m.error);
    }
  });

  setInterval(() => {
    const now = Date.now();
    if (!lastState && now - startedAt > 6000) {
      ui.showMessage('Cannot reach the source tab. Reload it and try again.');
      stalledShown = true;
    } else if (lastState && now - lastState > 6000) {
      ui.showMessage('Source tab disconnected.');
      stalledShown = true;
    } else if (ready && !paused && lastFrame && now - lastFrame > 4000) {
      ui.showMessage('No video frames received. The source tab may be in the background.');
      stalledShown = true;
    } else if (stalledShown) {
      stalledShown = false;
      ui.showMessage(null);
    }
  }, 1500);

  chrome.tabs.onRemoved.addListener((id) => {
    if (id === tabId) window.close();
  });

  let saveTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      chrome.storage.local.set({ multiSize: { width: window.innerWidth } }).catch(() => {});
    }, 400);
  });
  window.addEventListener('pagehide', () => sendTab({ type: 'mp-cap-stop', sid }));

  sendTab({ type: 'mp-cap-start', sid });
})();
