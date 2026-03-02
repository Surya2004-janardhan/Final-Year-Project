import { useState, useRef, useCallback, useEffect } from 'react';

export default function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(11);
  const [stream, setStream] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  // Keep the video element in sync with the stream whenever stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Callback ref — component calls this when <video> mounts/unmounts
  const setVideoElement = useCallback((el) => {
    videoRef.current = el;
    if (el && stream) {
      el.srcObject = stream;
    }
  }, [stream]);

  const requestPermission = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      setHasPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      return s;
    } catch (err) {
      console.error('Permission denied:', err);
      setHasPermission(false);
      return null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
      setHasPermission(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const startRecording = useCallback(async () => {
    let s = stream;
    if (!s) {
      s = await requestPermission();
      if (!s) return null;
    }

    chunksRef.current = [];

    const recorder = new MediaRecorder(s, { mimeType: 'video/webm;codecs=vp8,opus' });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        chunksRef.current = [];
        setIsRecording(false);
        clearInterval(timerRef.current);
        setCountdown(11);
        resolve(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      setCountdown(11);

      let sec = 11;
      timerRef.current = setInterval(() => {
        sec -= 1;
        setCountdown(sec);
        if (sec <= 0) {
          clearInterval(timerRef.current);
          if (recorder.state === 'recording') recorder.stop();
        }
      }, 1000);
    });
  }, [stream, requestPermission]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      clearInterval(timerRef.current);
      mediaRecorderRef.current.stop();
    }
  }, []);

  return {
    isRecording,
    countdown,
    stream,
    hasPermission,
    videoRef: setVideoElement, // callback ref so mirror works immediately
    requestPermission,
    stopStream,
    startRecording,
    stopRecording,
  };
}
