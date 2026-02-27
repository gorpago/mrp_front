// 메트로놈 Web Worker
let intervalId = null;
let isRunning = false;

self.onmessage = function(e) {
  const { action, bpm, timeSignature } = e.data;
  
  switch (action) {
    case 'start':
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      isRunning = true;
      const interval = 60000 / bpm; // ms per beat
      let beatCount = 0;
      
      console.log(`Worker: 메트로놈 시작 ${bpm} BPM, 간격: ${interval}ms`);
      
      // 첫 번째 비트 즉시 전송
      self.postMessage({ 
        type: 'beat', 
        beatCount: beatCount,
        timeSignature: timeSignature,
        isFirstBeat: beatCount === 0
      });
      
      intervalId = setInterval(() => {
        if (!isRunning) {
          clearInterval(intervalId);
          return;
        }
        
        beatCount = (beatCount + 1) % timeSignature;
        
        self.postMessage({ 
          type: 'beat', 
          beatCount: beatCount,
          timeSignature: timeSignature,
          isFirstBeat: beatCount === 0
        });
        
        console.log(`Worker: 비트 ${beatCount + 1}/${timeSignature} 전송`);
      }, interval);
      break;
      
    case 'stop':
      isRunning = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      console.log('Worker: 메트로놈 정지');
      break;
      
    case 'updateBpm':
      if (isRunning) {
        // BPM 변경 시 재시작
        self.postMessage({ type: 'restart', bpm: bpm, timeSignature: timeSignature });
      }
      break;
  }
};
