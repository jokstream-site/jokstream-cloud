import { DurableObject } from "cloudflare:workers";

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g, "").replace(/\\+/g, "-").replace(/\\//g, "_");
const fromB64url = (value) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4)), c => c.charCodeAt(0));

async function verifyTicket(ticket, room, secret) {
  if (!ticket || !secret) return false;
  const parts = ticket.split(".");
  if (parts.length !== 2) return false;
  try {
    const payloadBytes = fromB64url(parts[0]);
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    if (payload.room !== room || !Number.isFinite(payload.exp) || payload.exp < Date.now()) return false;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(parts[0])));
    const supplied = fromB64url(parts[1]);
    if (signature.length !== supplied.length) return false;
    let diff = 0;
    for (let i = 0; i < signature.length; i++) diff |= signature[i] ^ supplied[i];
    return diff === 0;
  } catch { return false; }
}

// Call this helper only from a trusted server after checking the user's session/access.
export async function createRoomTicket(room, secret, ttlSeconds = 300) {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ room, exp: Date.now() + ttlSeconds * 1000 })));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return payload + "." + b64url(signature);
}

export class PeerRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.maxPeers = 8;
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") return json({ error: "WebSocket upgrade required" }, 426);
    const current = this.ctx.getWebSockets().length;
    if (current >= this.maxPeers) return json({ error: "Room is full" }, 429);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const peerId = crypto.randomUUID();
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ peerId });
    const peers = this.ctx.getWebSockets().filter(ws => ws !== server).map(ws => ws.deserializeAttachment()?.peerId).filter(Boolean);
    server.send(JSON.stringify({ type: "welcome", peerId, peers }));
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === server) continue;
      try { ws.send(JSON.stringify({ type: "peer-joined", peerId })); } catch {}
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws, message) {
    if (typeof message !== "string" || message.length > 12000) return;
    let data;
    try { data = JSON.parse(message); } catch { return; }
    const allowed = new Set(["offer", "answer", "ice", "leave", "ping"]);
    if (!allowed.has(data.type)) return;
    if (data.type === "ping") {
      try { ws.send(JSON.stringify({ type: "pong", at: Date.now() })); } catch {}
      return;
    }
    const source = ws.deserializeAttachment()?.peerId;
    if (!source) return;
    if (data.type === "leave") {
      try { ws.close(1000, "left"); } catch {}
      return;
    }
    const target = String(data.to || "");
    if (!target || target === source) return;
    const recipient = this.ctx.getWebSockets().find(other => other !== ws && other.deserializeAttachment()?.peerId === target);
    if (!recipient) {
      try { ws.send(JSON.stringify({ type: "peer-gone", peerId: target })); } catch {}
      return;
    }
    try { recipient.send(JSON.stringify({ type: data.type, from: source, payload: data.payload })); } catch {}
  }

  webSocketClose(ws) {
    const peerId = ws.deserializeAttachment()?.peerId;
    if (!peerId) return;
    for (const other of this.ctx.getWebSockets()) {
      try { other.send(JSON.stringify({ type: "peer-left", peerId })); } catch {}
    }
  }

  webSocketError(ws) {
    try { ws.close(1011, "socket error"); } catch {}
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = (env.ALLOWED_ORIGINS || "").split(",").map(x => x.trim()).filter(Boolean);
    if (allowedOrigins.length && origin && !allowedOrigins.includes(origin)) return json({ error: "Origin not allowed" }, 403);
    if (url.pathname === "/health") return json({ ok: true, service: "jokstream-p2p-lab", mode: "signaling-only" });
    const match = url.pathname.match(/^\\/room\\/([a-zA-Z0-9_-]{8,120})$/);
    if (!match) return json({ error: "Not found" }, 404);
    const room = match[1];
    if (!(await verifyTicket(url.searchParams.get("ticket"), room, env.P2P_SIGNING_SECRET))) return json({ error: "Invalid or expired room ticket" }, 401);
    if (!env.PEER_ROOM) return json({ error: "Peer room binding is missing" }, 503);
    const id = env.PEER_ROOM.idFromName(room);
    return env.PEER_ROOM.get(id).fetch(request);
  }
};
