// No runtime.onMessage listener on purpose: content scripts detect a closed
// multi-window by their messages failing to reach any receiver.

const FILES = ['ui.js', 'content.js'];

chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'single', title: 'Picture-in-Picture (single window)', contexts: ['action', 'video'] });
    chrome.contextMenus.create({ id: 'multi', title: 'Open in separate PiP window (multi)', contexts: ['action', 'video'] });
  });
  const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
  for (const t of tabs) inject(t.id).catch(() => {});
});

chrome.action.onClicked.addListener((tab) => toggleSingle(tab));
chrome.commands.onCommand.addListener((command, tab) => {
  if (!tab) return;
  if (command === 'toggle-pip') toggleSingle(tab);
  else if (command === 'toggle-multi-pip') toggleMulti(tab);
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab) return;
  if (info.menuItemId === 'single') toggleSingle(tab);
  else if (info.menuItemId === 'multi') toggleMulti(tab);
});

chrome.windows.onRemoved.addListener(async (winId) => {
  const { multiWins = {} } = await chrome.storage.session.get('multiWins');
  let changed = false;
  for (const [tabId, id] of Object.entries(multiWins)) {
    if (id === winId) {
      delete multiWins[tabId];
      changed = true;
    }
  }
  if (changed) await chrome.storage.session.set({ multiWins });
});

function inject(tabId) {
  return chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: FILES });
}

function flash(tabId, text) {
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#d93025' });
  chrome.action.setBadgeText({ tabId, text });
  setTimeout(() => chrome.action.setBadgeText({ tabId, text: '' }), 2500);
}

const callToggle = () => (window.__pipx ? window.__pipx.toggle() : 'missing');
const callProbe = () => (window.__pipx ? window.__pipx.probe() : 'missing');

async function toggleSingle(tab) {
  const tabId = tab.id;
  try {
    const run = (target) => chrome.scripting.executeScript({ target, func: callToggle });
    let res = await run({ tabId, frameIds: [0] });
    let result = res[0] && res[0].result;
    if (result === 'missing') {
      await inject(tabId);
      res = await run({ tabId, frameIds: [0] });
      result = res[0] && res[0].result;
    }
    if (result === 'novideo') {
      const all = await run({ tabId, allFrames: true });
      const results = all.map((r) => r.result);
      result = results.includes('opened') ? 'opened' : results.includes('closed') ? 'closed' : 'novideo';
    }
    if (result === 'novideo') flash(tabId, '!');
    else if (result === 'unsupported' || (result && result.startsWith('error'))) flash(tabId, 'X');
  } catch (e) {
    flash(tabId, 'X');
  }
}

async function probeFrames(tabId) {
  const run = () => chrome.scripting.executeScript({ target: { tabId, allFrames: true }, func: callProbe });
  let res = await run();
  if (res.every((r) => r.result === 'missing')) {
    await inject(tabId);
    res = await run();
  }
  return res
    .filter((r) => r.result && r.result !== 'missing')
    .sort((a, b) => b.result.score - a.result.score);
}

async function toggleMulti(tab) {
  const tabId = tab.id;
  try {
    const { multiWins = {} } = await chrome.storage.session.get('multiWins');
    if (multiWins[tabId]) {
      const id = multiWins[tabId];
      delete multiWins[tabId];
      await chrome.storage.session.set({ multiWins });
      try {
        await chrome.windows.remove(id);
        return;
      } catch (e) { /* window already gone: open a new one */ }
    }

    const best = (await probeFrames(tabId))[0];
    if (!best) return flash(tabId, '!');

    const saved = (await chrome.storage.local.get('multiSize')).multiSize;
    const width = Math.max(240, (saved && saved.width) || 480);
    const ar = best.result.w && best.result.h ? best.result.w / best.result.h : 16 / 9;
    const n = Object.keys(multiWins).length;
    const sid = crypto.randomUUID();
    const url = chrome.runtime.getURL(`multi.html?tab=${tabId}&frame=${best.frameId}&sid=${sid}`);

    const win = await chrome.windows.create({
      url,
      type: 'popup',
      width: width + 16,
      height: Math.round(width / ar) + 60,
      left: 80 + n * 40,
      top: 80 + n * 40,
      focused: true
    });
    multiWins[tabId] = win.id;
    await chrome.storage.session.set({ multiWins });
  } catch (e) {
    flash(tabId, 'X');
  }
}
