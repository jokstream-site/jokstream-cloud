(() => {
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function connection(){
    const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection||{};
    const type=String(c.effectiveType||'').toLowerCase();
    const downlink=Number(c.downlink||0);
    const rtt=Number(c.rtt||0);
    let tier='good';
    if(type==='slow-2g'||type==='2g'||(downlink>0&&downlink<1.2)||rtt>650)tier='poor';
    else if(type==='3g'||(downlink>0&&downlink<3)||rtt>300)tier='fair';
    return {tier,downlink,rtt,effectiveType:type||'unknown'};
  }
  function config({live=false}={}){
    const net=connection();
    const poor=net.tier==='poor',fair=net.tier==='fair';
    const base=live?32:90;
    const max=live?48:120;
    return {
      enableWorker:true,lowLatencyMode:false,
      maxBufferLength:poor?(live?16:45):fair?(live?24:65):base,
      maxMaxBufferLength:poor?(live?24:70):fair?(live?36:90):max,
      backBufferLength:live?(poor?8:fair?12:18):(poor?45:fair?65:90),
      liveSyncDurationCount:poor?4:3,liveMaxLatencyDurationCount:poor?10:8,
      maxBufferHole:.5,highBufferWatchdogPeriod:2,startFragPrefetch:true,
      fragLoadingMaxRetry:poor?8:6,fragLoadingRetryDelay:poor?650:800,fragLoadingMaxRetryTimeout:25000,
      manifestLoadingMaxRetry:5,levelLoadingMaxRetry:6,
      enableWebVTT:true,renderTextTracksNatively:true,
      capLevelToPlayerSize:true,testBandwidth:true,
      abrBandWidthFactor:poor?.65:fair?.72:.82,abrBandWidthUpFactor:poor?.45:fair?.55:.7,
      abrEwmaFastLive:2,abrEwmaSlowLive:7,abrEwmaFastVoD:3,abrEwmaSlowVoD:10
    };
  }
  function secondsAhead(video){
    if(!video||!video.buffered||!video.buffered.length)return 0;
    const now=video.currentTime;
    for(let i=0;i<video.buffered.length;i++){const start=video.buffered.start(i),end=video.buffered.end(i);if(now>=start-.25&&now<=end+.25)return clamp(end-now,0,600)}
    return 0;
  }
  window.JokBufferPolicy=Object.freeze({config,secondsAhead,connection});
})();