/**
 * useDaemon — Background Monitoring Service
 *
 * Behavior per plan.md requirements #3, #4, #5, #6:
 * - When Auto Mode is ON, repeating timer fires every `intervalMinutes`.
 * - When timer fires: record for exactly `recordDurationMinutes` (real camera time).
 * - After recording: send to Flask /process in background, persist result via IPC.
 * - After processing: detect emotional shift vs. recent history.
 * - If shift detected: fire native OS notification via IPC.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

const ipc = typeof window !== 'undefined' && window.require
  ? window.require('electron').ipcRenderer
  : null;

const NEGATIVE_EMOTIONS = ['angry', 'sad', 'fearful', 'disgust'];

export default function useDaemon({ settings, onNewResult }) {
  const [isDaemonActive, setIsDaemonActive] = useState(false);
  const [daemonStatus, setDaemonStatus] = useState('idle');
  const [nextFireIn, setNextFireIn] = useState(null);

  const intervalRef    = useRef(null);
  const countdownRef   = useRef(null);
  const recordingRef   = useRef(null);
  const streamRef      = useRef(null);
  const recentEmotions = useRef([]); // rolling buffer of last 5 results
  // Always-fresh settings to avoid stale closure bugs in callbacks
  const settingsRef    = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // ── Helpers ───────────────────────────────────────────────
  const requestStream = async () => {
    if (streamRef.current && streamRef.current.active) return streamRef.current;
    const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = s;
    return s;
  };

  const recordForDuration = useCallback((stream, durationMs) => {
    return new Promise((resolve) => {
      const chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
      recordingRef.current = recorder;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));

      recorder.start(200);
      setDaemonStatus('recording');

      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, durationMs);
    });
  }, []);

  const analyzeBlob = useCallback(async (blob) => {
    // Ensure backend is running before sending
    if (ipc) {
      const status = await ipc.invoke('backend-status');
      if (!status.running) {
        await ipc.invoke('start-backend');
        // Wait a moment for it to be ready
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    const formData = new FormData();
    formData.append('video', blob, 'daemon_recording.webm');

    const { default: axios } = await import('axios');
    const { data } = await axios.post('http://127.0.0.1:5000/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5 min timeout for long recordings
    });
    return data;
  }, []);

  const detectShift = useCallback((newEmotion) => {
    const history = recentEmotions.current;
    // newEmotion is NOT yet in history when this is called
    if (!NEGATIVE_EMOTIONS.includes(newEmotion)) return false; // Only notify on negative emotions

    const prev = history[history.length - 1]; // last confirmed emotion before current
    if (!prev) return true; // first reading ever, and it's negative → always notify

    const wasPositive = !NEGATIVE_EMOTIONS.includes(prev);

    // Trigger if: was positive and now negative, OR 2+ negatives in a row
    const recentNeg = history.slice(-2).filter(e => NEGATIVE_EMOTIONS.includes(e)).length;
    return wasPositive || recentNeg >= 2;
  }, []);

  const triggerNotification = useCallback(async (emotion) => {
    // Use ref to get always-fresh settings (avoids stale closure)
    const { notifyPermission, musicMappings } = settingsRef.current;
    const musicPath = musicMappings?.[emotion] || null;
    const autoPlay  = notifyPermission === 'auto';

    console.log(`[Daemon] Triggering notification → ${emotion}. AutoPlay: ${autoPlay}. Music: ${musicPath}`);

    if (ipc) {
      try {
        await ipc.invoke('notify-shift', { emotion, autoPlay, musicPath });
        console.log('[Daemon] Notification IPC sent successfully');
      } catch(e) {
        console.error('[Daemon] Notification IPC failed:', e);
      }
    } else {
      // Fallback: web Notification API
      try {
        if (Notification.permission !== 'granted') {
          await Notification.requestPermission();
        }
        new Notification('EmotionAI – Shift Detected', {
          body: `Detected shift to ${emotion}. ${autoPlay ? 'Playing music.' : 'Open app to respond.'}`
        });
      } catch(e) {
        console.error('[Daemon] Web notification fallback failed:', e);
      }
    }
  }, []);  // empty deps — reads from settingsRef.current at call time


  // ── Core Session ──────────────────────────────────────────
  const runSession = useCallback(async () => {
    const durationMs = (settings.recordDurationMinutes || 5) * 60 * 1000;
    console.log(`[Daemon] Session start — recording ${settings.recordDurationMinutes} min`);

    try {
      const stream = await requestStream();
      setDaemonStatus('recording');

      const blob = await recordForDuration(stream, durationMs);
      setDaemonStatus('processing');

      const result = await analyzeBlob(blob);

      if (result && !result.error) {
        const emotion = result.fused_emotion;
        console.log(`[Daemon] Analysis done. Emotion: ${emotion}`);

        // Detect shift BEFORE pushing into history
        const shouldNotify = detectShift(emotion);

        // Now update rolling buffer
        recentEmotions.current.push(emotion);
        if (recentEmotions.current.length > 5) recentEmotions.current.shift();

        // Persist result via IPC
        if (ipc) await ipc.invoke('save-result', result);

        // Notify parent
        if (onNewResult) onNewResult(result);

        // Fire notification if shift detected
        if (shouldNotify) {
          console.log(`[Daemon] Shift confirmed — firing notification for ${emotion}`);
          await triggerNotification(emotion);
        }

        // Celebrate improvements (#15)
        const wasNeg = NEGATIVE_EMOTIONS.includes(recentEmotions.current.slice(-2)[0] || '');
        const isNowPos = ['happy', 'neutral'].includes(emotion);
        if (wasNeg && isNowPos && ipc) {
          ipc.invoke('notify-shift', {
            emotion,
            autoPlay: false,
            musicPath: null,
            // Override body (main.cjs handles the positive case too)
            positive: true,
          });
        }
      }
    } catch(err) {
      console.error('[Daemon] Session error:', err);
    } finally {
      setDaemonStatus('waiting');
    }
  }, [settings, recordForDuration, analyzeBlob, detectShift, triggerNotification, onNewResult]);

  // ── Start / Stop ──────────────────────────────────────────
  const startDaemon = useCallback(() => {
    if (isDaemonActive) return;
    setIsDaemonActive(true);
    setDaemonStatus('waiting');
    recentEmotions.current = [];

    const intervalMs = (settings.intervalMinutes || 15) * 60 * 1000;

    // Show countdown to next session
    let secsLeft = intervalMs / 1000;
    setNextFireIn(secsLeft);
    countdownRef.current = setInterval(() => {
      secsLeft -= 1;
      setNextFireIn(secsLeft);
    }, 1000);

    // Run first session immediately after 3s
    setTimeout(() => runSession(), 3000);

    // Then repeat on interval
    intervalRef.current = setInterval(() => {
      secsLeft = intervalMs / 1000;
      setNextFireIn(secsLeft);
      runSession();
    }, intervalMs);

    console.log(`[Daemon] Started. Interval: ${settings.intervalMinutes} min, Duration: ${settings.recordDurationMinutes} min`);
  }, [isDaemonActive, settings, runSession]);

  const stopDaemon = useCallback(() => {
    clearInterval(intervalRef.current);
    clearInterval(countdownRef.current);

    if (recordingRef.current && recordingRef.current.state === 'recording') {
      recordingRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    setIsDaemonActive(false);
    setDaemonStatus('idle');
    setNextFireIn(null);
    console.log('[Daemon] Stopped.');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  return {
    isDaemonActive,
    daemonStatus,
    nextFireIn,
    startDaemon,
    stopDaemon,
  };
}
