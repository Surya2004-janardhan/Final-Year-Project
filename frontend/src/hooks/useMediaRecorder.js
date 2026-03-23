import { useState, useRef, useCallback, useEffect } from 'react';
import { logError, logInfo } from '../utils/logger';
import { classifyMediaError, queryMediaPermissionState } from '../utils/mediaPermissions';

const MEDIA_CONSTRAINTS = {
  video: {
    width: { ideal: 640, max: 1280 },
    height: { ideal: 480, max: 720 },
    frameRate: { ideal: 15, max: 24 },
  },
  audio: true,
};

export default function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [permissionState, setPermissionState] = useState('unknown');
  const [lastCaptureMeta, setLastCaptureMeta] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const videoRef = useRef(null);

  const setVideoElement = useCallback((node) => {
    videoRef.current = node;
    if (node && stream) {
      node.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    let active = true;
    const loadPermissionState = async () => {
      const state = await queryMediaPermissionState();
      if (!active) return;
      const bothGranted = state.camera === 'granted' && state.microphone === 'granted';
      setPermissionState(bothGranted ? 'granted' : (state.camera === 'denied' || state.microphone === 'denied' ? 'denied' : 'unknown'));
      if (!bothGranted && !stream) {
        setHasPermission(false);
      }
    };
    loadPermissionState();
    return () => {
      active = false;
    };
  }, [stream]);

  const requestPermission = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
      setStream(s);
      setHasPermission(true);
      setPermissionState('granted');
      setPermissionError(null);
      logInfo('recorder', 'camera+mic permission granted');
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      return s;
    } catch (err) {
      const kind = classifyMediaError(err);
      const message = kind === 'permission_denied'
        ? 'Please enable both camera and microphone access for EmotionAI.'
        : kind === 'device_busy'
          ? 'Camera or microphone is currently being used by another app. Close that app and try again.'
          : kind === 'device_missing'
            ? 'Camera or microphone was not found on this system.'
            : (err?.message || 'Camera/microphone access blocked.');
      logError('recorder', 'camera+mic request failed', { error: err?.message, kind });
      setHasPermission(false);
      setPermissionState(kind === 'permission_denied' ? 'denied' : 'unknown');
      setPermissionError(message);
      return null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (stream) {
      logInfo('recorder', 'stopping media stream');
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
      setHasPermission(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const startRecording = useCallback(async () => {
    logInfo('recorder', 'manual recording requested');
    let s = stream;
    if (!s) {
      s = await requestPermission();
      if (!s) return null;
    }

    chunksRef.current = [];

    const hasAudio = s.getAudioTracks().length > 0;
    const mimeType = hasAudio ? 'video/webm;codecs=vp8,opus' : 'video/webm;codecs=vp8';
    const recorder = new MediaRecorder(s, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    return new Promise((resolve) => {
      const startedAt = new Date().toISOString();
      recorder.onstop = () => {
        const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        chunksRef.current = [];
        setIsRecording(false);
        setLastCaptureMeta({
          startedAt,
          endedAt: new Date().toISOString(),
        });
        logInfo('recorder', 'manual recording completed', { startedAt, size: totalSize });
        resolve(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      logInfo('recorder', 'manual recording started', { startedAt });
    });
  }, [stream, requestPermission]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      logInfo('recorder', 'manual recording stop requested');
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  return {
    isRecording,
    stream,
    hasPermission,
    permissionState,
    permissionError,
    lastCaptureMeta,
    videoRef: setVideoElement,
    requestPermission,
    stopStream,
    startRecording,
    stopRecording,
  };
}
