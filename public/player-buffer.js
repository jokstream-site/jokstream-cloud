(() => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function config({ live = false } = {}) {
    // Live keeps a shorter safety cushion to avoid drifting too far behind the live edge.
    // VOD can safely accumulate a larger forward buffer.
    return {
      enableWorker: true,
      lowLatencyMode: false,
      maxBufferLength: live ? 32 : 90,
      maxMaxBufferLength: live ? 48 : 120,
      backBufferLength: live ? 18 : 90,
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 8,
      maxBufferHole: 0.5,
      highBufferWatchdogPeriod: 2,
      startFragPrefetch: true,
      fragLoadingMaxRetry: 6,
      fragLoadingRetryDelay: 800,
      fragLoadingMaxRetryTimeout: 20000,
      manifestLoadingMaxRetry: 4,
      levelLoadingMaxRetry: 5,
      enableWebVTT: true,
      renderTextTracksNatively: true
    };
  }
  function secondsAhead(video) {
    if (!video || !video.buffered || !video.buffered.length) return 0;
    const now = video.currentTime;
    for (let i = 0; i < video.buffered.length; i++) {
      const start = video.buffered.start(i), end = video.buffered.end(i);
      if (now >= start - 0.25 && now <= end + 0.25) return clamp(end - now, 0, 600);
    }
    return 0;
  }
  window.JokBufferPolicy = Object.freeze({ config, secondsAhead });
})();
