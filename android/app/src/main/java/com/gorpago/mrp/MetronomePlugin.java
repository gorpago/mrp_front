package com.gorpago.mrp;

import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeMetronome")
public class MetronomePlugin extends Plugin {
    
    private Handler handler;
    private AudioTrack audioTrack;
    private boolean isPlaying = false;
    private long startTimeMs = 0;
    private int bpm = 120;
    private int currentBeat = 0;
    private int timeSignature = 4;
    
    // 오디오 설정
    private static final int SAMPLE_RATE = 44100;
    private static final int BEAT_DURATION_MS = 100;
    
    @Override
    public void load() {
        handler = new Handler(Looper.getMainLooper());
        initAudioTrack();
    }
    
    private void initAudioTrack() {
        int bufferSize = AudioTrack.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        );
        
        AudioAttributes attributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .build();
        
        AudioFormat format = new AudioFormat.Builder()
            .setSampleRate(SAMPLE_RATE)
            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
            .build();
        
        audioTrack = new AudioTrack.Builder()
            .setAudioAttributes(attributes)
            .setAudioFormat(format)
            .setBufferSizeInBytes(bufferSize)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build();
    }
    
    @PluginMethod
    public void start(PluginCall call) {
        Integer bpmValue = call.getInt("bpm", 120);
        Integer timeSignatureValue = call.getInt("timeSignature", 4);
        Long syncStartTime = call.getLong("syncStartTime");
        
        this.bpm = bpmValue;
        this.timeSignature = timeSignatureValue;
        this.currentBeat = 0;
        
        if (syncStartTime != null && syncStartTime > 0) {
            // 동기화된 시작 시간 사용
            long currentTime = System.currentTimeMillis();
            long delayMs = syncStartTime - currentTime;
            
            if (delayMs > 0) {
                // 정확한 시간에 시작하도록 예약
                handler.postDelayed(() -> startMetronome(), delayMs);
                
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("message", "Metronome scheduled to start in " + delayMs + "ms");
                call.resolve(ret);
            } else {
                // 즉시 시작
                startMetronome();
                
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("message", "Metronome started immediately");
                call.resolve(ret);
            }
        } else {
            // 즉시 시작
            startMetronome();
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "Metronome started");
            call.resolve(ret);
        }
    }
    
    private void startMetronome() {
        if (isPlaying) {
            return;
        }
        
        isPlaying = true;
        startTimeMs = SystemClock.elapsedRealtime();
        
        if (audioTrack.getState() == AudioTrack.STATE_INITIALIZED) {
            audioTrack.play();
        }
        
        scheduleNextBeat();
    }
    
    private void scheduleNextBeat() {
        if (!isPlaying) {
            return;
        }
        
        long intervalMs = 60000L / bpm;
        long nextBeatTime = startTimeMs + (currentBeat * intervalMs);
        long currentTime = SystemClock.elapsedRealtime();
        long delayMs = nextBeatTime - currentTime;
        
        if (delayMs < 0) {
            delayMs = 0;
        }
        
        handler.postAtTime(() -> {
            if (isPlaying) {
                playBeat(currentBeat % timeSignature == 0);
                
                // JavaScript로 비트 이벤트 전송
                JSObject beatEvent = new JSObject();
                beatEvent.put("beat", currentBeat % timeSignature);
                beatEvent.put("timestamp", System.currentTimeMillis());
                notifyListeners("beat", beatEvent);
                
                currentBeat++;
                scheduleNextBeat();
            }
        }, nextBeatTime);
    }
    
    private void playBeat(boolean isAccent) {
        // 비프음 생성 (사인파)
        int frequency = isAccent ? 800 : 400;
        int numSamples = (SAMPLE_RATE * BEAT_DURATION_MS) / 1000;
        short[] buffer = new short[numSamples];
        
        for (int i = 0; i < numSamples; i++) {
            double angle = 2.0 * Math.PI * i * frequency / SAMPLE_RATE;
            double amplitude = 0.3 * Math.sin(angle);
            
            // 엔벨로프 적용 (페이드 아웃)
            double envelope = 1.0 - ((double) i / numSamples);
            buffer[i] = (short) (amplitude * envelope * Short.MAX_VALUE);
        }
        
        audioTrack.write(buffer, 0, numSamples);
    }
    
    @PluginMethod
    public void stop(PluginCall call) {
        stopMetronome();
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Metronome stopped");
        call.resolve(ret);
    }
    
    private void stopMetronome() {
        isPlaying = false;
        currentBeat = 0;
        handler.removeCallbacksAndMessages(null);
        
        if (audioTrack != null && audioTrack.getPlayState() == AudioTrack.PLAYSTATE_PLAYING) {
            audioTrack.pause();
            audioTrack.flush();
        }
    }
    
    @PluginMethod
    public void updateBpm(PluginCall call) {
        Integer newBpm = call.getInt("bpm");
        
        if (newBpm != null && newBpm > 0) {
            this.bpm = newBpm;
            
            if (isPlaying) {
                // BPM 변경 시 다음 비트부터 적용
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("bpm", this.bpm);
                call.resolve(ret);
            } else {
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("bpm", this.bpm);
                call.resolve(ret);
            }
        } else {
            call.reject("Invalid BPM value");
        }
    }
    
    @PluginMethod
    public void getServerTimeOffset(PluginCall call) {
        // NTP 방식으로 서버 시간 오프셋 계산
        // 실제 구현은 서버 API 호출 필요
        JSObject ret = new JSObject();
        ret.put("offset", 0);
        ret.put("timestamp", System.currentTimeMillis());
        call.resolve(ret);
    }
    
    @Override
    protected void handleOnDestroy() {
        stopMetronome();
        
        if (audioTrack != null) {
            audioTrack.release();
            audioTrack = null;
        }
        
        super.handleOnDestroy();
    }
}
