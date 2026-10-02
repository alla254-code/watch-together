# WatchTogether

A small web app for sharing a screen with a friend while using a separate text-chat panel.

## Features
- Room-code joining (one host, up to 7 other participants)
- Host chooses a screen, app window, or browser tab using the browser's native share picker
- Separate room text chat
- Stop sharing and full-screen viewing
- Responsive layout for desktop and mobile browsers

## Requirements
- Node.js 18 or newer
- Internet connection for npm install
- A modern browser
- For screen capture: use `http://localhost:3000` for local testing, or deploy behind HTTPS for other devices/networks.

## Run on your PC
1. Install Node.js LTS from https://nodejs.org/
2. Extract this ZIP.
3. Open the extracted folder in VS Code.
4. Open Terminal in VS Code and run:
   ```bash
   npm install
   npm start
   ```
5. Open http://localhost:3000 in your browser.
6. Choose **I am sharing my screen**, enter a room code (for example `BLUEBIRD42`) and click **Join room**.
7. Click **Start sharing**, then choose the screen/window/tab in the browser picker.

## Let your friend join
Both users must open the same deployed address and enter the same room code. A room code alone does not connect two separate computers across the internet; the app must be hosted on a reachable server.

For remote internet use, deploy to a trusted Node.js host that supports WebSockets and HTTPS. Screen sharing requires a secure context. This simple starter uses a public STUN server but no TURN relay, so some strict networks/NATs may prevent video from connecting. A TURN service may be needed for reliable connections. For private deployment, add authentication and rate limiting before exposing it publicly.

## Watching TV / phone
- **PC:** open the app in Chrome, Edge, or another supported modern browser.
- **Phone:** use a modern browser. On many phones, browser-based screen capture is restricted or unavailable; a phone's native screen-cast feature or a dedicated native app may be needed. The host can instead share a browser tab from a PC.
- **Smart TV:** if the TV browser supports modern WebRTC, it may be able to watch; many TV browsers are limited. Another practical option is opening the shared room on a laptop and casting that tab to the TV.
- This shares visual/audio capture offered by the browser. Some protected streaming services block capture or show a black screen. Use only content you are allowed to share.

## Important limitations
- This app does not remotely control devices.
- Audio capture depends on the selected browser source and operating system; not every source offers audio.
- No cloud recording is implemented.
- Room codes are not passwords. Do not use this on a public server for sensitive conversations without adding authentication, HTTPS, and other protections.
- It does not bypass DRM, screen locks, or content protection.
