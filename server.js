const http = require("node:http");
const { URL } = require("node:url");
const { timingSafeEqual } = require("node:crypto");

const PORT = Number(process.env.PORT || 3000);
const baseRaw = process.env.XTREAM_BASE_URL || "";
const upstreamUser = process.env.XTREAM_USERNAME || "";
const upstreamPass = process.env.XTREAM_PASSWORD || "";
const clientUser = process.env.JOKSTREAM_USERNAME || "";
const clientPass = process.env.JOKSTREAM_PASSWORD || "";
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
function authorized(url, pathParts = []) {
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
function sourceUrl(kind, id) {
  const b = upstreamBase();
  b.pathname = b.pathname.replace(/\/$/, "") + "/" + kind + "/" +
    encodeURIComponent(upstreamUser) + "/" + encodeURIComponent(upstreamPass) + "/" + encodeURIComponent(id);
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
  const { Readable } = require("node:stream");
  Readable.fromWeb(upstream.body).pipe(res);
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
    if (req.method !== "GET" && req.method !== "HEAD") return json(res, 405, { error: "Method not allowed" });
    if (requestUrl.pathname === "/player_api.php") {
      if (!authorized(requestUrl)) return json(res, 401, { error: "Invalid JokStream proxy credentials" });
      const b = upstreamBase();
      b.pathname = b.pathname.replace(/\/$/, "") + "/player_api.php";
      b.search = requestUrl.search;
      b.searchParams.set("username", upstreamUser);
      b.searchParams.set("password", upstreamPass);
      return pipeResponse(await safeFetch(b, { accept: req.headers.accept || "application/json" }), res, req);
    }
    if (requestUrl.pathname === "/proxy") {
      if (!authorized(requestUrl)) return json(res, 401, { error: "Invalid JokStream proxy credentials" });
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
    const parts = requestUrl.pathname.split("/").filter(Boolean);
    if (parts.length === 4 && ["live", "movie", "series"].includes(parts[0])) {
      if (!authorized(requestUrl, parts.slice(1, 3))) return json(res, 401, { error: "Invalid JokStream proxy credentials" });
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
