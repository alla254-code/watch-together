const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const WebSocket = require("ws");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, "public");
const rooms = new Map();

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  const routes = {
    "/": ["index.html", "text/html; charset=utf-8"],
    "/app.js": ["app.js", "text/javascript; charset=utf-8"],
    "/style.css": ["style.css", "text/css; charset=utf-8"]
  };
  const route = routes[pathname];
  if (!route) { res.writeHead(404); return res.end("Not found"); }
  fs.readFile(path.join(PUBLIC, route[0]), (err, data) => {
    if (err) { res.writeHead(500); return res.end("Server error"); }
    res.writeHead(200, {
      "Content-Type": route[1],
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer"
    });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server, maxPayload: 64 * 1024 });
function send(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}
function roomInfo(room) {
  return { type: "peers", peers: [...room.members].map(([id, p]) => ({ id, role: p.role })) };
}
function broadcast(room, payload, exceptId = null) {
  for (const [id, peer] of room.members) if (id !== exceptId) send(peer.ws, payload);
}
wss.on("connection", ws => {
  const id = crypto.randomBytes(8).toString("hex");
  let currentRoom = null;
  let closed = false;

  ws.on("message", raw => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return send(ws, { type: "error", message: "Invalid message." }); }
    if (!msg || typeof msg.type !== "string") return;

    if (msg.type === "join") {
      const roomCode = String(msg.room || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
      const role = msg.role === "host" ? "host" : "viewer";
      if (roomCode.length < 4) return send(ws, { type: "error", message: "Room code must be at least 4 characters." });
      if (currentRoom) return send(ws, { type: "error", message: "You have already joined a room." });
      let room = rooms.get(roomCode);
      if (!room) { room = { members: new Map(), hostId: null }; rooms.set(roomCode, room); }
      if (role === "host" && room.hostId && room.members.has(room.hostId)) {
        return send(ws, { type: "error", message: "This room already has a host. Choose another room code." });
      }
      if (room.members.size >= 8) return send(ws, { type: "error", message: "Room is full (maximum 8 participants)." });
      currentRoom = roomCode;
      room.members.set(id, { ws, role });
      if (role === "host") room.hostId = id;
      send(ws, { type: "joined", id, room: roomCode, role, hostId: room.hostId });
      broadcast(room, { type: "system", text: `${role === "host" ? "Host" : "A viewer"} joined the room.` }, id);
      for (const [otherId, peer] of room.members) {
        if (otherId !== id) send(ws, { type: "peer", id: otherId, role: peer.role });
      }
      broadcast(room, roomInfo(room));
      return;
    }

    if (!currentRoom) return send(ws, { type: "error", message: "Join a room first." });
    const room = rooms.get(currentRoom);
    if (!room) return;
    if (msg.type === "chat") {
      const text = String(msg.text || "").trim().slice(0, 1000);
      if (text) broadcast(room, { type: "chat", from: id, role: room.members.get(id)?.role || "viewer", text, at: Date.now() });
    } else if (["offer", "answer", "ice"].includes(msg.type)) {
      const target = room.members.get(String(msg.to || ""));
      if (!target) return send(ws, { type: "error", message: "Peer is no longer in the room." });
      send(target.ws, { ...msg, from: id });
    } else if (msg.type === "leave") {
      leave();
    }
  });

  function leave() {
    if (closed) return;
    closed = true;
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) {
        const member = room.members.get(id);
        room.members.delete(id);
        if (room.hostId === id) room.hostId = null;
        broadcast(room, { type: "system", text: `${member?.role === "host" ? "Host" : "A viewer"} left the room.` });
        broadcast(room, roomInfo(room));
        if (room.members.size === 0) rooms.delete(currentRoom);
      }
    }
    try { ws.close(); } catch {}
  }
  ws.on("close", leave);
  ws.on("error", leave);
});
server.listen(PORT, "0.0.0.0", () => {
  console.log(`WatchTogether is running on http://localhost:${PORT}`);
  console.log("For friends on other networks, deploy behind HTTPS/WSS.");
});