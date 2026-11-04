const http = require("node:http");
const { URL } = require("node:url");
const { timingSafeEqual, createHmac, randomBytes } = require("node:crypto");

const PORT = Number(process.env.PORT || 3000);
const baseRaw = process.env.XTREAM_BASE_URL || "";
const upstreamUser = process.env.XTREAM_USERNAME || "";
const upstreamPass = process.env.XTREAM_PASSWORD || "";
const clientUser = process.env.JOKSTREAM_USERNAME || "";
const clientPass = process.env.JOKSTREAM_PASSWORD || "";
const publicSessionSecret = randomBytes(32);
const sessionRequests = new Map();
function issuePublicToken(ip) {
  const now = Date.now(), recent = (sessionRequests.get(ip) || []).filter(t => now - t < 3600000);
  if (recent.length >= 5) return null;
  recent.push(now); sessionRequests.set(ip, recent);
  const payload = Buffer.from(JSON.stringify({ ip, exp: now + 20 * 60 * 1000 })).toString("base64url");
  return payload + "." + createHmac("sha256", publicSessionSecret).update(payload).digest("base64url");
}
function requestIp(req) { return (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim(); }
function publicAuthorized(url, req) {
  const token = url.searchParams.get("token") || "";
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", publicSessionSecret).update(payload).digest();
  const actual = Buffer.from(sig, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try { const data = JSON.parse(Buffer.from(payload, "base64url").toString()); return data.ip === requestIp(req) && data.exp > Date.now(); } catch { return false; }
}
const allowedHosts = new Set(
  [baseRaw, ...(process.env.XTREAM_ALLOWED_HOSTS || "").split(",")]
    .map(v => v.trim()).filter(Boolean)
    .map(v => { try { return new URL(v.includes("://") ? v : "https://" + v).hostname.toLowerCase(); } catch { return ""; } })
    .filter(Boolean)
);

function sameSecret(a, b) {
  const aa = Buffer.from(String(a || ""));
  const bb = Buffer.from(String(b || ""));
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
function authorized(url, pathParts = [], req = null) {
  if (req && publicAuthorized(url, req)) return true;
  const u = url.searchParams.get("username") || pathParts[0] || "";
  const p = url.searchParams.get("password") || pathParts[1] || "";
  return !!clientUser && !!clientPass && sameSecret(u, clientUser) && sameSecret(p, clientPass);
}
function json(res, status, value) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(value));
}
function upstreamBase() {
  if (!baseRaw || !upstreamUser || !upstreamPass) throw new Error("Upstream credentials are not configured");
  const b = new URL(baseRaw);
  if (!["http:", "https:"].includes(b.protocol)) throw new Error("XTREAM_BASE_URL must use HTTP or HTTPS");
  return b;
}
function allowed(url) {
  return ["http:", "https:"].includes(url.protocol) && allowedHosts.has(url.hostname.toLowerCase());
}
async function safeFetch(initialUrl, headers = {}) {
  let current = new URL(initialUrl);
  for (let i = 0; i < 6; i++) {
    if (!allowed(current)) throw new Error("Upstream host is not allowlisted. Add its hostname to XTREAM_ALLOWED_HOSTS if it belongs to your provider.");
    const response = await fetch(current, { headers, redirect: "manual" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) return response;
    current = new URL(location, current);
  }
  throw new Error("Too many upstream redirects");
}
function sourceUrl(kind, id, extension = "") {
  const b = upstreamBase();
  b.pathname = b.pathname.replace(/\/$/, "") + "/" + kind + "/" +
    encodeURIComponent(upstreamUser) + "/" + encodeURIComponent(upstreamPass) + "/" + encodeURIComponent(id) + extension;
  b.search = "";
  return b;
}
function proxyUrl(reqUrl, target) {
  const out = new URL("/proxy", reqUrl);
  out.searchParams.set("username", clientUser);
  out.searchParams.set("password", clientPass);
  out.searchParams.set("url", target.toString());
  return out.pathname + out.search;
}
function rewritePlaylist(text, manifestUrl, reqUrl) {
  const rewriteUri = raw => {
    const resolved = new URL(raw, manifestUrl);
    if (!allowed(resolved)) throw new Error("Playlist references a host not in XTREAM_ALLOWED_HOSTS");
    return proxyUrl(reqUrl, resolved);
  };
  return text.split(/\r?\n/).map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    if (trimmed.startsWith("#")) return line.replace(/URI="([^"]+)"/g, (_, uri) => 'URI="' + rewriteUri(uri) + '"');
    return rewriteUri(trimmed);
  }).join("\n");
}
async function pipeResponse(upstream, res, req) {
  const headers = {};
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges", "last-modified", "etag"]) {
    const v = upstream.headers.get(h); if (v) headers[h] = v;
  }
  headers["access-control-allow-origin"] = "*";
  headers["cache-control"] = "no-store";
  res.writeHead(upstream.status, headers);
  if (req.method === "HEAD" || !upstream.body) return res.end();
  const { Readable, pipeline } = require("node:stream");
  pipeline(Readable.fromWeb(upstream.body), res, err => {
    if (err) console.error("upstream_stream_error:", err.message);
  });
}
const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  // Allow the Netlify-hosted frontend to call this API from the browser.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range, Accept, Authorization");
  res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }
  try {
    if (requestUrl.pathname === "/health") return json(res, 200, { ok: true, service: "jokstream-cloud", configured: !!(baseRaw && upstreamUser && upstreamPass && clientUser && clientPass) });
    if (requestUrl.pathname === "/") return json(res, 200, { service: "JokStream Cloud", health: "/health", api: "/player_api.php", note: "Authorized-content proxy; configure credentials in Render environment." });
    if (requestUrl.pathname === "/public/session") {
      const token = issuePublicToken(requestIp(req));
      if (!token) return json(res, 429, { error: "Temporary test limit reached. Try again later." });
      return json(res, 200, { ok: true, token, expires_in: 1200 });
    }
    if (requestUrl.pathname === "/public/player_api.php") {
      if (!publicAuthorized(requestUrl, req)) return json(res, 401, { error: "Test session expired. Refresh the page." });
      const b = upstreamBase();
      b.pathname = b.pathname.replace(/\/$/, "") + "/player_api.php";
      b.search = "";
      for (const [key, value] of requestUrl.searchParams) if (key !== "token") b.searchParams.set(key, value);
      b.searchParams.set("username", upstreamUser);
      b.searchParams.set("password", upstreamPass);
      return pipeResponse(await safeFetch(b, { accept: "application/json" }), res, req);
    }
    if (req.method !== "GET" && req.method !== "HEAD") return json(res, 405, { error: "Method not allowed" });
    if (requestUrl.pathname === "/player_api.php") {
      if (!authorized(requestUrl, [], req)) return json(res, 401, { error: "Invalid or expired test session" });
      const b = upstreamBase();
      b.pathname = b.pathname.replace(/\/$/, "") + "/player_api.php";
      b.search = requestUrl.search;
      b.searchParams.set("username", upstreamUser);
      b.searchParams.set("password", upstreamPass);
      return pipeResponse(await safeFetch(b, { accept: req.headers.accept || "application/json" }), res, req);
    }
    if (requestUrl.pathname === "/proxy") {
      if (!authorized(requestUrl, [], req)) return json(res, 401, { error: "Invalid or expired test session" });
      const target = new URL(requestUrl.searchParams.get("url") || "");
      if (!allowed(target)) return json(res, 403, { error: "Upstream host is not allowlisted" });
      const h = {};
      if (req.headers.range) h.range = req.headers.range;
      if (req.headers["if-range"]) h["if-range"] = req.headers["if-range"];
      const upstream = await safeFetch(target, h);
      const ct = (upstream.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("mpegurl") || target.pathname.toLowerCase().endsWith(".m3u8")) {
        const rewritten = rewritePlaylist(await upstream.text(), target, requestUrl);
        res.writeHead(upstream.status, { "content-type": "application/vnd.apple.mpegurl", "cache-control": "no-store", "access-control-allow-origin": "*" });
        return res.end(rewritten);
      }
      return pipeResponse(upstream, res, req);
    }
    const publicParts = requestUrl.pathname.split("/").filter(Boolean);
    if (publicParts.length === 3 && publicParts[0] === "public" && ["live", "movie", "series"].includes(publicParts[1])) {
      if (!publicAuthorized(requestUrl, req)) return json(res, 401, { error: "Test session expired. Refresh the page." });
      const extMatch = publicParts[2].match(/\.(m3u8|ts|mp4|mkv|avi)$/i);
      const extension = extMatch ? extMatch[0] : ".m3u8";
      const id = publicParts[2].replace(/\.(m3u8|ts|mp4|mkv|avi)$/i, "");
      const target = sourceUrl(publicParts[1], id, extension);
      const upstream = await safeFetch(target, req.headers.range ? { range: req.headers.range } : {});
      const ct = (upstream.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("mpegurl") || target.pathname.toLowerCase().endsWith(".m3u8")) {
        const rewritten = rewritePlaylist(await upstream.text(), target, requestUrl);
        res.writeHead(upstream.status, { "content-type": "application/vnd.apple.mpegurl", "cache-control": "no-store", "access-control-allow-origin": "*" });
        return res.end(rewritten);
      }
      return pipeResponse(upstream, res, req);
    }
    const parts = requestUrl.pathname.split("/").filter(Boolean);
    if (parts.length === 4 && ["live", "movie", "series"].includes(parts[0])) {
      if (!authorized(requestUrl, parts.slice(1, 3), req)) return json(res, 401, { error: "Invalid or expired test session" });
      const target = sourceUrl(parts[0], parts[3]);
      const h = {};
      if (req.headers.range) h.range = req.headers.range;
      if (req.headers["if-range"]) h["if-range"] = req.headers["if-range"];
      const upstream = await safeFetch(target, h);
      const ct = (upstream.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("mpegurl") || target.pathname.toLowerCase().endsWith(".m3u8")) {
        const rewritten = rewritePlaylist(await upstream.text(), target, requestUrl);
        res.writeHead(upstream.status, { "content-type": "application/vnd.apple.mpegurl", "cache-control": "no-store", "access-control-allow-origin": "*" });
        return res.end(rewritten);
      }
      return pipeResponse(upstream, res, req);
    }
    return json(res, 404, { error: "Not found" });
  } catch (err) {
    console.error("request_error:", err.message);
    return json(res, 502, { error: "Upstream request failed", detail: err.message });
  }
});
server.listen(PORT, "0.0.0.0", () => console.log("JokStream Cloud listening on " + PORT));
