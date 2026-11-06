# JokStream P2P + Buffer Lab

This is an isolated prototype branch. It is **not deployed** and is not connected to the live site or the production Worker.

## Scope

- A configurable HLS.js buffer policy: a modest live cushion and a larger VOD cushion.
- A Durable Object WebSocket signaling room, sharded by opaque room key.
- A browser WebRTC data-channel prototype for exchanging authorized media segments.
- The origin/CDN remains the fallback. P2P is an optimization, never the only source.

## Buffer behavior

`public/player-buffer.js` sets a target forward buffer of about 32 seconds for live and 90 seconds for VOD, subject to segment duration, device memory, browser limits, network throughput and HLS.js behavior. These are targets, not a promise that the exact number of seconds will always be available.

Live streams use a smaller back buffer and bounded live latency so the player does not drift indefinitely behind the live edge. Movies and episodes can retain more already-played media and build a larger forward cushion.

The player UI can report buffered seconds ahead. A buffer can mask a short origin/network interruption only while enough media was downloaded before the interruption. It cannot conceal an outage longer than the available buffer.

## Signaling Worker

`worker.js` exposes:

- `GET /health`
- `GET /room/{roomKey}` with WebSocket upgrade and a short-lived signed `ticket`

The Worker validates an HMAC ticket scoped to one room and expiry. A trusted authenticated backend must mint tickets using `createRoomTicket`; never expose `P2P_SIGNING_SECRET` to the browser. Configure `ALLOWED_ORIGINS` and `P2P_SIGNING_SECRET` as secrets/vars in the isolated environment.

The Durable Object only coordinates peer discovery and signaling. It does not proxy or store video segments. Each room is a separate Durable Object instance and has a conservative peer cap.

## Client prototype

`client.js` contains a small WebRTC mesh and segment data-channel protocol. It is intentionally not wired to HLS.js yet. Before integration, add:

1. A trusted segment cache keyed by canonical asset/episode/channel + rendition + sequence/discontinuity.
2. Hash/length verification for every segment before playback.
3. A bounded LRU cache and strict byte/time quotas.
4. Peer scoring, retries across peers, and immediate origin fallback.
5. A proper TURN service for restrictive NATs; STUN alone is not sufficient.
6. A loader adapter for HLS.js that asks peers first, waits only a short deadline, then fetches the normal authorized stream URL.
7. Live-window expiry: only current/recent live segments may be shared; never serve stale live media.
8. Per-room authorization, abuse controls, telemetry, and privacy-safe identifiers.

## Suggested room keys

- Live: channel + rendition + current live-window identity.
- Movie: movie ID + rendition.
- Series: series ID + episode ID + rendition.

Do not use raw provider URLs, usernames, passwords, tokens, or stream credentials in room keys or peer messages.

## Isolated Wrangler configuration

`wrangler.jsonc` creates a new Worker and a SQLite-backed Durable Object class. It does not modify the existing `jokstream-api` Worker. Review the account's current limits and the applicable video-delivery terms before deploying or load testing.

## Validation status

Source scaffold only. No remote namespace, Worker, production binding, deployment, or live-player integration has been created by this branch yet. The segment transfer code is an experimental protocol and requires browser tests and security review before it can be used.
