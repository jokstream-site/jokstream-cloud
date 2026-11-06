// Experimental WebRTC mesh for authorized HLS segment exchange.
// This module is intentionally not wired into the production player yet.
export class JokPeerMesh {
  constructor({ signalingUrl, room, ticket, iceServers = [{ urls: "stun:stun.l.google.com:19302" }], onSegment, onStatus = () => {}, maxPeers = 6 }) {
    Object.assign(this, { signalingUrl, room, ticket, iceServers, onSegment, onStatus, maxPeers });
    this.socket = null;
    this.peerConnections = new Map();
    this.channels = new Map();
    this.pending = new Map();
    this.receiving = new Map();
    this.incomingKeyByPeer = new Map();
    this.closed = false;
  }

  connect() {
    if (this.socket) return Promise.resolve();
    const url = new URL(this.signalingUrl);
    url.pathname = url.pathname.replace(/\/$/, "") + "/room/" + encodeURIComponent(this.room);
    url.searchParams.set("ticket", this.ticket);
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this.socket = ws;
      ws.onopen = () => { this.onStatus("signaling-connected"); resolve(); };
      ws.onerror = () => { this.onStatus("signaling-error"); reject(new Error("Signaling connection failed")); };
      ws.onmessage = event => this._signal(event.data).catch(() => this.onStatus("peer-error"));
      ws.onclose = () => { this.socket = null; if (!this.closed) this.onStatus("signaling-closed"); };
    });
  }

  async _signal(raw) {
    const msg = JSON.parse(raw);
    if (msg.type === "welcome") {
      this.peerId = msg.peerId;
      for (const peerId of (msg.peers || []).slice(0, this.maxPeers)) await this._makePeer(peerId, true);
      this.onStatus("room-ready");
      return;
    }
    if (msg.type === "peer-joined") {
      if (this.peerConnections.size < this.maxPeers) await this._makePeer(msg.peerId, false);
      return;
    }
    if (msg.type === "peer-left" || msg.type === "peer-gone") { this._dropPeer(msg.peerId); return; }
    const pc = this.peerConnections.get(msg.from);
    if (!pc) return;
    if (msg.type === "offer") {
      await pc.setRemoteDescription(msg.payload);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this._send({ type: "answer", to: msg.from, payload: pc.localDescription });
    } else if (msg.type === "answer") {
      await pc.setRemoteDescription(msg.payload);
    } else if (msg.type === "ice" && msg.payload) {
      try { await pc.addIceCandidate(msg.payload); } catch {}
    }
  }

  async _makePeer(peerId, initiator) {
    if (!peerId || this.peerConnections.has(peerId)) return;
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peerConnections.set(peerId, pc);
    pc.onicecandidate = event => { if (event.candidate) this._send({ type: "ice", to: peerId, payload: event.candidate }); };
    pc.ondatachannel = event => this._attachChannel(peerId, event.channel);
    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) this._dropPeer(peerId);
      this.onStatus("peer-" + pc.connectionState);
    };
    if (initiator) this._attachChannel(peerId, pc.createDataChannel("segments", { ordered: true }));
    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this._send({ type: "offer", to: peerId, payload: pc.localDescription });
    }
  }

  _attachChannel(peerId, channel) {
    this.channels.set(peerId, channel);
    channel.binaryType = "arraybuffer";
    channel.bufferedAmountLowThreshold = 256 * 1024;
    channel.onmessage = event => this._channelMessage(peerId, event.data);
    channel.onopen = () => this.onStatus("datachannel-open");
    channel.onclose = () => this.onStatus("datachannel-closed");
  }

  async _channelMessage(peerId, data) {
    if (typeof data === "string") {
      let msg; try { msg = JSON.parse(data); } catch { return; }
      if (msg.type === "get-segment" && typeof this.onSegment === "function") {
        const value = await this.onSegment(msg.key);
        if (value) await this._sendBytes(peerId, msg.key, value);
      } else if (msg.type === "segment-meta") {
        const pending = this.pending.get(msg.key);
        if (!pending || pending.peerId !== peerId || !Number.isInteger(msg.total) || msg.total < 1 || msg.total > 512) return;
        this.receiving.set(peerId + ":" + msg.key, { key: msg.key, chunks: new Array(msg.total), received: 0, total: msg.total });
        this.incomingKeyByPeer.set(peerId, msg.key);
      } else if (msg.type === "segment-chunk") {
        const current = this.receiving.get(peerId + ":" + msg.key);
        if (current && Number.isInteger(msg.index) && msg.index >= 0 && msg.index < current.total) current.nextIndex = msg.index;
      } else if (msg.type === "segment-end") {
        const key = peerId + ":" + msg.key, current = this.receiving.get(key);
        if (!current) return;
        if (current.received !== current.total || current.chunks.some(chunk => !chunk)) {
          this.receiving.delete(key); this.incomingKeyByPeer.delete(peerId);
          const pending = this.pending.get(msg.key);
          if (pending && pending.peerId === peerId) { this.pending.delete(msg.key); pending.reject(new Error("Incomplete peer segment")); }
          return;
        }
        const size = current.chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        if (size > 8 * 1024 * 1024) { this.receiving.delete(key); this.incomingKeyByPeer.delete(peerId); return; }
        const merged = new Uint8Array(size); let offset = 0;
        for (const chunk of current.chunks) { merged.set(new Uint8Array(chunk), offset); offset += chunk.byteLength; }
        this.receiving.delete(key);
        this.incomingKeyByPeer.delete(peerId);
        const pending = this.pending.get(msg.key);
        if (pending && pending.peerId === peerId) { this.pending.delete(msg.key); pending.resolve(merged); }
      }
      return;
    }
    const activeKey = this.incomingKeyByPeer.get(peerId);
    const current = activeKey ? this.receiving.get(peerId + ":" + activeKey) : null;
    if (current && Number.isInteger(current.nextIndex)) {
      current.chunks[current.nextIndex] = data;
      current.received++;
      current.nextIndex = undefined;
    }
  }

  async _sendBytes(peerId, key, value) {
    const channel = this.channels.get(peerId);
    if (!channel || channel.readyState !== "open") return;
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
    if (!bytes.byteLength || bytes.byteLength > 8 * 1024 * 1024) return;
    const chunkSize = 16 * 1024, total = Math.ceil(bytes.byteLength / chunkSize);
    channel.send(JSON.stringify({ type: "segment-meta", key, total }));
    for (let index = 0; index < total; index++) {
      await this._waitForChannel(channel);
      channel.send(JSON.stringify({ type: "segment-chunk", key, index }));
      const chunk = bytes.slice(index * chunkSize, Math.min(bytes.byteLength, (index + 1) * chunkSize));
      channel.send(chunk);
    }
    channel.send(JSON.stringify({ type: "segment-end", key }));
  }

  _waitForChannel(channel) {
    if (channel.bufferedAmount < 512 * 1024) return Promise.resolve();
    return new Promise(resolve => {
      const done = () => { channel.removeEventListener("bufferedamountlow", done); resolve(); };
      channel.addEventListener("bufferedamountlow", done, { once: true });
    });
  }

  requestSegment(key, timeoutMs = 3500) {
    const peers = [...this.channels.entries()].filter(([, channel]) => channel.readyState === "open");
    if (!peers.length) return Promise.reject(new Error("No connected peers"));
    const peer = peers[Math.floor(Math.random() * peers.length)];
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(key); reject(new Error("Peer segment timeout")); }, timeoutMs);
      this.pending.set(key, { peerId: peer[0], resolve: value => { clearTimeout(timer); resolve(value); }, reject });
      peer[1].send(JSON.stringify({ type: "get-segment", key }));
    });
  }

  _send(message) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  _dropPeer(peerId) {
    try { this.channels.get(peerId)?.close(); } catch {}
    try { this.peerConnections.get(peerId)?.close(); } catch {}
    this.channels.delete(peerId); this.peerConnections.delete(peerId);
    this.incomingKeyByPeer.delete(peerId);
    for (const [key, pending] of this.pending) if (pending.peerId === peerId) { pending.reject(new Error("Peer disconnected")); this.pending.delete(key); }
  }

  close() {
    this.closed = true;
    for (const id of this.peerConnections.keys()) this._dropPeer(id);
    try { this._send({ type: "leave" }); this.socket?.close(); } catch {}
    this.socket = null;
    for (const pending of this.pending.values()) pending.reject(new Error("Peer mesh closed"));
    this.pending.clear();
  }
}
