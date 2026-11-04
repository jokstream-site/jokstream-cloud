# JokStream Cloud

A small Node.js proxy/facade for an Xtream-compatible provider. It keeps provider credentials on the server and exposes separate JokStream client credentials.

## Important
- Use this only for streams and VOD you own or are explicitly licensed/authorized to redistribute.
- This is an API/media proxy, **not** a video CDN or a transcoding/origin platform. It does not promise unlimited viewers, bandwidth, uptime, or that one upstream connection is shared by every viewer.
- Live playlists are not cached. HLS playlists are rewritten so segment/key requests pass through this service. VOD byte-range headers are forwarded for seeking.
- Render Free is suitable only for a low-traffic test; sleeping/limits/capacity can interrupt playback. Production streaming generally needs a suitable paid media origin/CDN and provider permission.

## Render environment variables
Set these in Render Dashboard > your service > Environment. Never commit secrets:
- XTREAM_BASE_URL (provider base URL, e.g. https://host:port)
- XTREAM_USERNAME
- XTREAM_PASSWORD
- JOKSTREAM_USERNAME (separate credentials entered in JokStream client)
- JOKSTREAM_PASSWORD
- XTREAM_ALLOWED_HOSTS (optional comma-separated provider/CDN hostnames required by redirects or HLS playlists)

The service reports whether configuration is present at /health but never returns credential values.

## Routes
- GET /health
- GET /player_api.php?username=CLIENT&password=CLIENT&action=...
- GET /live/CLIENT/CLIENT_PASSWORD/STREAM_ID.ts
- GET /movie/CLIENT/CLIENT_PASSWORD/STREAM_ID.mp4
- GET /series/CLIENT/CLIENT_PASSWORD/EPISODE_ID.mp4
- GET /proxy?username=CLIENT&password=CLIENT&url=ENCODED_UPSTREAM_URL (used for rewritten HLS segments and keys)

For /player_api.php, standard Xtream query parameters are forwarded while upstream username/password are replaced server-side. For stream paths, credentials are the separate JokStream client credentials, not provider credentials.

## Deploy
- Runtime: Node.js 20+
- Build: npm install
- Start: npm start
