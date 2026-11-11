/* JokStream VAST pre-roll bridge
 * HilltopAds Video: VAST 3.0
 * This file only wires the supplied VAST feed into the existing player.
 */
(() => {
  const VAST_TAG = 'https://smooth-survey.com/d/m.Fcz/dNGbNdvZZnGlUF/FePmQ9/ugZsU-lCkuPBTtcz2JMKDsY/1uM/DzkCtlN/zzY-wKNWjAUvxDMXwS';

  let adDisplayContainer = null;
  let adsLoader = null;
  let adsManager = null;
  let initializedByGesture = false;
  let pendingStart = null;
  let active = false;
  let finishing = false;
  let skipButton = null;
  let skipTimer = null;
  let adRequestTimer = null;

  const $ = id => document.getElementById(id);

  function setStatus(text) {
    const el = $('playerStatus');
    if (el && active) el.textContent = text;
  }

  function clearSkipUi() {
    if (adRequestTimer) { clearTimeout(adRequestTimer); adRequestTimer = null; }
    if (skipTimer) { clearInterval(skipTimer); skipTimer = null; }
    if (skipButton) { skipButton.remove(); skipButton = null; }
  }

  function showSkipUi() {
    clearSkipUi();
    const box = $('adContainer');
    if (!box) return;
    skipButton = document.createElement('button');
    skipButton.type = 'button';
    skipButton.textContent = 'Skip ad when available';
    Object.assign(skipButton.style, {
      position:'absolute', right:'12px', bottom:'12px', zIndex:'20',
      border:'1px solid #ffffff55', background:'#000b', color:'#fff',
      borderRadius:'7px', padding:'7px 11px', fontWeight:'800', fontSize:'12px',
      cursor:'pointer', backdropFilter:'blur(6px)'
    });
    skipButton.disabled = true;
    box.appendChild(skipButton);
    skipTimer = setInterval(() => {
      if (!skipButton || !adsManager) { clearSkipUi(); return; }
      const skippable = typeof adsManager.getAdSkippableState === 'function' && adsManager.getAdSkippableState();
      if (skippable) {
        skipButton.disabled = false;
        skipButton.textContent = 'Skip ad';
      } else {
        skipButton.textContent = 'Skip when available';
      }
    }, 500);
    skipButton.addEventListener('click', () => {
      if (!adsManager) return;
      try { if (adsManager.getAdSkippableState()) adsManager.skip(); } catch {}
    });
  }

  function cleanupManager() {
    clearSkipUi();
    if (adsManager) {
      try { adsManager.destroy(); } catch {}
    }
    adsManager = null;
    active = false;
    finishing = false;
    const box = $('adContainer');
    if (box) box.classList.remove('show');
  }

  function resumeContent(reason) {
    if (finishing) return;
    finishing = true;
    const next = pendingStart;
    pendingStart = null;
    cleanupManager();
    if (reason === 'error') setStatus('No ad available — starting content');
    if (typeof next === 'function') next();
  }

  function ensureIMA() {
    const container = $('adContainer');
    const video = $('video');
    if (!container || !video || !window.google?.ima) return false;

    if (!adDisplayContainer) {
      adDisplayContainer = new google.ima.AdDisplayContainer(container, video);
    }
    if (!adsLoader) {
      adsLoader = new google.ima.AdsLoader(adDisplayContainer);
      adsLoader.addEventListener(
        google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        onAdsManagerLoaded
      );
      adsLoader.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR,
        () => resumeContent('error')
      );
    }
    return true;
  }

  function onAdsManagerLoaded(event) {
    if (!pendingStart) {
      try { event.getAdsManager().destroy(); } catch {}
      return;
    }

    const video = $('video');
    const box = $('adContainer');
    const width = Math.max(320, box?.clientWidth || video?.clientWidth || 640);
    const height = Math.max(180, box?.clientHeight || video?.clientHeight || 360);

    try {
      const settings = new google.ima.AdsRenderingSettings();
      settings.restoreCustomPlaybackStateOnAdBreakComplete = true;
      adsManager = event.getAdsManager(video, settings);

      adsManager.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR,
        () => resumeContent('error')
      );
      adsManager.addEventListener(
        google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
        () => {
          active = true;
          if (box) box.classList.add('show');
          video?.pause();
          setStatus('Video ad…');
        }
      );
      adsManager.addEventListener(
        google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
        () => resumeContent('complete')
      );
      adsManager.addEventListener(
        google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
        () => resumeContent('complete')
      );
      adsManager.addEventListener(
        google.ima.AdEvent.Type.STARTED,
        () => {
          active = true;
          if (box) box.classList.add('show');
          showSkipUi();
          setStatus('Video ad…');
        }
      );

      adsManager.init(width, height, google.ima.ViewMode.NORMAL);
      adsManager.start();
    } catch (error) {
      console.warn('JokStream VAST start failed', error);
      resumeContent('error');
    }
  }

  function requestAd(meta, onReady) {
    if (!ensureIMA()) {
      onReady();
      return;
    }

    pendingStart = onReady;
    finishing = false;

    try {
      const request = new google.ima.AdsRequest();
      request.adTagUrl = VAST_TAG;
      request.linearAdSlotWidth = Math.max(320, $('video')?.clientWidth || 640);
      request.linearAdSlotHeight = Math.max(180, $('video')?.clientHeight || 360);
      request.nonLinearAdSlotWidth = request.linearAdSlotWidth;
      request.nonLinearAdSlotHeight = Math.max(90, Math.round(request.linearAdSlotHeight * 0.25));
      request.contentTitle = String(meta?.title || 'JokStream');
      request.setAdWillAutoPlay?.(true);
      request.setAdWillPlayMuted?.(false);
      adsLoader.requestAds(request);
      adRequestTimer = setTimeout(() => { if (pendingStart && !active) resumeContent('error'); }, 9000);
    } catch (error) {
      console.warn('JokStream VAST request failed', error);
      resumeContent('error');
    }
  }

  function armFromGesture() {
    if (!ensureIMA() || initializedByGesture) return;
    try {
      adDisplayContainer.initialize();
      initializedByGesture = true;
    } catch (error) {
      console.warn('JokStream IMA initialize failed', error);
    }
  }

  function cancel() {
    pendingStart = null;
    if (adsManager) {
      try { adsManager.stop(); } catch {}
      try { adsManager.destroy(); } catch {}
    }
    adsManager = null;
    active = false;
    finishing = false;
    const box = $('adContainer');
    if (box) box.classList.remove('show');
  }

  window.JokAds = {
    playPreRoll(meta, onReady) {
      // The player click itself is a valid user gesture. Initialize IMA here too,
      // instead of depending only on an earlier pointerdown listener.
      if (!initializedByGesture) armFromGesture();
      if (!initializedByGesture) { onReady(); return; }
      requestAd(meta, onReady);
    },
    armFromGesture,
    cancel
  };

  document.addEventListener('pointerdown', armFromGesture, true);
  document.addEventListener('touchstart', armFromGesture, true);
  window.addEventListener('resize', () => {
    if (!adsManager) return;
    const box = $('adContainer');
    const width = Math.max(320, box?.clientWidth || $('video')?.clientWidth || 640);
    const height = Math.max(180, box?.clientHeight || $('video')?.clientHeight || 360);
    try { adsManager.resize(width, height, google.ima.ViewMode.NORMAL); } catch {}
  });
})();
