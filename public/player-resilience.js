(() => {
  'use strict';

  function networkProfile() {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    const type = String(c.effectiveType || '').toLowerCase();
    const downlink = Number(c.downlink || 0);
    const rtt = Number(c.rtt || 0);
    if (type === 'slow-2g' || type === '2g' || (downlink > 0 && downlink < 0.8) || rtt > 900) return 'critical';
    if (type === '3g' || (downlink > 0 && downlink < 2) || rtt > 450) return 'poor';
    if (downlink > 0 && downlink < 5 || rtt > 250) return 'fair';
    return 'good';
  }

  function bufferAhead(video) {
    if (!video?.buffered?.length) return 0;
    const t = video.currentTime;
    for (let i = 0; i < video.buffered.length; i++) {
      const start = video.buffered.start(i), end = video.buffered.end(i);
      if (t >= start - 0.25 && t <= end + 0.25) return Math.max(0, end - t);
    }
    return 0;
  }

  function attach(hls, video, { live = false, onStatus } = {}) {
    if (!hls || !video || !live) return () => {};
    let stopped = false;
    let timer = null;
    let lastAction = 0;
    let recoveryAt = 0;
    let forcedLevel = null;

    const status = (msg) => {
      if (typeof onStatus === 'function') onStatus(msg);
    };

    function chooseLevel(profile, urgent) {
      const levels = Array.isArray(hls.levels) ? hls.levels : [];
      if (!levels.length) return;
      const now = Date.now();
      if (!urgent && now - lastAction < 7000) return;

      if (profile === 'critical' || profile === 'poor' || urgent) {
        const target = Math.max(0, Math.min(1, levels.length - 1));
        if (hls.currentLevel !== target) {
          hls.currentLevel = target;
          forcedLevel = target;
          lastAction = now;
          status('Weak connection · switching to a lighter stream');
        }
        return;
      }

      if (forcedLevel !== null && profile === 'good' && bufferAhead(video) >= 10 && now - recoveryAt > 12000) {
        hls.currentLevel = -1;
        forcedLevel = null;
        recoveryAt = now;
        lastAction = now;
        status('Connection recovered · adaptive quality restored');
      }
    }

    function tick() {
      if (stopped || !hls.media) return;
      const profile = networkProfile();
      const ahead = bufferAhead(video);
      const urgent = ahead < 2.5;
      chooseLevel(profile, urgent);

      if (ahead < 1.2) {
        status('Buffering · protecting playback');
      } else if (ahead < 4 && profile !== 'good') {
        status('Playing · weak connection · buffer ' + Math.floor(ahead) + ' sec');
      }
    }

    timer = setInterval(tick, 2000);
    tick();

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const onChange = () => {
      lastAction = 0;
      tick();
    };
    connection?.addEventListener?.('change', onChange);

    const onWaiting = () => {
      if (bufferAhead(video) < 2) chooseLevel(networkProfile(), true);
    };
    video.addEventListener('waiting', onWaiting);

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      connection?.removeEventListener?.('change', onChange);
      video.removeEventListener('waiting', onWaiting);
    };
  }

  window.JokLiveResilience = Object.freeze({ attach, networkProfile, bufferAhead });
})();
