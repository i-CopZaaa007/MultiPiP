<p align="center">
  <img src="project/icons/icon128.png" alt="MultiPiP icon" width="128" height="128">
</p>

<h1 align="center">MultiPiP</h1>

<p align="center">
  Picture-in-Picture for Chrome with full playback controls, subtitles, and multiple floating windows at once.
</p>

---

## Contents

- [About](#about)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Mode 1: Single window](#mode-1-single-window)
  - [Mode 2: Multiple windows](#mode-2-multiple-windows)
  - [Controls and keyboard shortcuts](#controls-and-keyboard-shortcuts)
  - [Changing the shortcuts](#changing-the-shortcuts)

---

## About

MultiPiP is a Chrome extension (Manifest V3) for watching a video in a small floating window while you work on something else. The window has a full set of playback controls and can show subtitles.

What sets it apart from regular Picture-in-Picture is that it can **open several windows at once**. Chrome's built-in PiP allows only one window per browser: opening a new one closes the previous one. MultiPiP adds a second mode that gives each tab its own floating window, so you can keep several YouTube tabs playing side by side.

It is meant to be loaded manually as an unpacked extension.

---

## Features

### Basics
- Toggle PiP with a keyboard shortcut, the toolbar icon, or the right-click menu
- Playback controls in the PiP window: play/pause, rewind/forward 10 seconds, seek bar, volume and mute, playback speed, next video
- Subtitles for YouTube, Netflix, Disney+ and Prime Video, shown inside the PiP window (toggle with the `CC` button)
- Remembers the window size for next time
- No white borders around the video: the background is always black, and a "fill" button removes letterboxing
- Keyboard shortcuts while the PiP window is hovered or focused
- Grow or shrink the window while keeping the video's aspect ratio (`E` / `S`)

### Multiple windows
- Open the video from any number of tabs, each in its own floating window, at the same time
- Same controls and keyboard shortcuts as the single-window mode
- The window title follows the source tab's title
- A window closes automatically when its source tab is closed
- New windows open slightly offset from the previous one so they don't stack exactly on top of each other
- Remembers the window width for next time

---

## Installation

Requires **Google Chrome 116 or later** (the extension uses the Document Picture-in-Picture API). Works on macOS and Windows.

1. Download or clone this repository.
   ```bash
   git clone <repository URL>
   ```
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the folder that contains `manifest.json`.
5. Click the puzzle-piece icon in the toolbar and pin **MultiPiP** so it is always one click away.
6. **Reload any tab that was already open before installing.** The extension tries to attach itself to existing tabs, but a reload is the safest way.

If you change the code later, click the reload button on the extension's card in `chrome://extensions`, then reload the tab you are testing with.

---

## Usage

MultiPiP has two modes. Use whichever fits the situation.

| | Single window | Multiple windows |
|---|---|---|
| Shortcut (Windows) | `Alt + P` | `Alt + Shift + M` |
| Shortcut (macOS) | `Option + P` | `Option + Shift + M` |
| Open at the same time | 1 window in the whole browser | Many (1 per tab) |
| Window type | Chrome's PiP window (floats above other apps) | A regular Chrome window |
| DRM-protected video (Netflix, etc.) | Works | Does not work |

You can also use the toolbar icon (single window), or right-click the toolbar icon and pick an option from the menu.

### Mode 1: Single window

1. Open a page with a video and start playing it.
2. Press `Alt + P`, or click the MultiPiP icon in the toolbar.
3. The video moves into a floating PiP window with the controls attached.
4. Press `Alt + P` again, or close the PiP window, to put the video back on the page. It keeps playing.

If the page has more than one video, MultiPiP picks the largest one that is playing.

Notes:
- Chrome only allows one of these windows at a time. Opening it from another tab replaces the current one. Use mode 2 if you need more than one.
- If Chrome refuses to open the window because it needs a click first, a short message appears on the page. Click anywhere on the page once and the window opens.

### Mode 2: Multiple windows

1. Open a YouTube tab, start the video, and press `Alt + Shift + P`. A floating window opens.
2. Switch to a second YouTube tab, start its video, and press `Alt + Shift + P`. A second window opens and the first one stays.
3. Repeat for as many tabs as you like.
4. Close a window by any of these:
   - Click its close button
   - Press `Alt + Shift + P` again in the source tab
   - Close the source tab
   - Press `Alt + P` while the floating window is focused

You can also right-click the toolbar icon and choose **Open in separate PiP window (multi)**.

Things to know in this mode:
- **Sound still comes from the source tab**, not from the floating window. The floating window is muted to avoid doubled audio, so keep the source tab open. The volume controls in the floating window control the source tab's video.
- Every control in the floating window sends its command back to the video in the source tab.
- The windows are regular Chrome windows, so they may not stay above other apps the way a true PiP window does.
- DRM-protected video (Netflix, Disney+, Prime Video) cannot be captured in this mode. Use single-window mode for those.
- On macOS, if Chrome is in full-screen mode, opening a floating window makes macOS slide to another Space. To avoid it, expand the Chrome window without entering full screen (Option-click the green button, or double-click the title bar), and use YouTube's Theater mode (`T`) instead of full screen (`F`).

### Controls and keyboard shortcuts

Hover over the PiP window to show the control bar. It hides itself after the mouse has been still for about 2.5 seconds. Clicking the video itself also toggles play/pause.

**On-screen controls**

| Control | What it does |
|---|---|
| Seek bar (top) | Jump to a point in the video (hidden for live streams) |
| ⏪ 10 | Rewind 10 seconds |
| ▶ / ⏸ | Play / pause |
| ⏩ 10 | Forward 10 seconds |
| ⏭ | Next video (appears only when the site has a "next" button) |
| Time | Current time / total time, or `LIVE` |
| 🔊 and volume slider | Mute and set the volume (the slider is hidden in very narrow windows) |
| `1x` | Change speed; cycles through 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x |
| `CC` | Show or hide subtitles in the PiP window |
| Crop icon | Fill the window to remove black bars (the video edges may be cropped) |

**Keyboard shortcuts** (work while the PiP window is hovered or focused)

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `←` / `→` | Rewind / forward 10 seconds |
| `↑` / `↓` | Volume up / down by 10% |
| `M` | Mute / unmute |
| `E` | Expand the window (keeps aspect ratio) |
| `S` | Shrink the window (keeps aspect ratio) |
| `C` | Fill the window / back to normal |
| `Alt + P` | Close the PiP window |

### Changing the shortcuts

Open `chrome://extensions/shortcuts` and set the keys you want. If a shortcut conflicts with another program, Chrome leaves the field empty, and you need to set it again on this page.
