import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShieldCheck, RefreshCcw, Command, Layout } from "lucide-react";
import NeuralPulse from "./components/NeuralPulse";
import EmotionRadar from "./components/EmotionRadar";
import NarrativeColumn from "./components/NarrativeColumn";
import RecommendationGrid from "./components/RecommendationGrid";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const processVideo = async (file) => {
    if (!file) return;
    setIsProcessing(true);
    setResults(null);
    setError(null);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const response = await fetch("http://localhost:5000/process", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResults(data);
    } catch (err) {
      setError("System failure. Retrying...");
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    setResults(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const file = new File([blob], "capture.webm", { type: "video/webm" });
        processVideo(file);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 11000);

    } catch (err) {
      setError("Camera Access Denied");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-gray-100 p-8 lg:p-20 relative font-sans">
      
      {/* ── Header Area ── */}
      <header className="flex justify-between items-center mb-40 max-w-6xl mx-auto py-8 border-b border-gray-100">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
             <Command className="w-6 h-6" /> EmotionAI
          </h1>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.5em] mt-1 ml-1 opacity-60">Human State Analysis // Prototype 5.x</span>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 px-6 py-2.5 rounded-full border border-gray-100 group">
           <div className={`w-2 h-2 rounded-full flex items-center justify-center transition-all ${isProcessing ? 'bg-black animate-pulse' : 'bg-gray-200'}`} />
           <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">
             {isProcessing ? 'Processing Telemetry' : 'Standby System'}
           </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-48">
        
        {/* Recording Section - Clean Centered Iris */}
        <section className="flex flex-col items-center gap-16 relative">
          <NeuralPulse 
            isRecording={isRecording} 
            videoRef={videoRef} 
          />
          
          <div className="flex flex-col items-center gap-8">
            <button
              onClick={startRecording}
              disabled={isRecording || isProcessing}
              className="px-16 py-6 bg-black text-white rounded-full text-[12px] font-bold uppercase tracking-[0.6em] transition-all hover:tracking-[0.8em] active:scale-95 disabled:opacity-30 disabled:tracking-[0.6em] shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
            >
              {isRecording ? 'Capturing Session' : 'Initiate Session'}
            </button>
            <AnimatePresence>
              {error && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-black text-[10px] font-black uppercase tracking-widest bg-gray-50 px-6 py-2 rounded-full border border-gray-100">
                    <Activity className="w-3 h-3 text-red-500" /> {error}
                 </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Results Overview - Detailed Monochrome Analysis */}
        <AnimatePresence>
          {results && !isProcessing && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="grid lg:grid-cols-2 gap-24 items-start"
            >
              <div className="lg:sticky lg:top-20">
                <EmotionRadar emotions={results.emotion_distribution} />
              </div>
              <div className="space-y-4">
                <NarrativeColumn story={results.story} quote={results.quote} />
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Discovery Feed - Clean High-End Cards */}
        <AnimatePresence>
          {results && !isProcessing && (
            <motion.section
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <RecommendationGrid songs={results.songs} video={{ title: results.video, link: results.video }} />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-48 pt-20 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-12 max-w-6xl mx-auto opacity-30">
        <div className="flex items-center gap-8 text-[9px] font-black uppercase tracking-[0.6em] italic">
           <span>Session Active</span>
           <div className="w-1.5 h-1.5 bg-black rounded-full" />
           <span>2026.AR2</span>
           <div className="w-1.5 h-1.5 bg-black rounded-full" />
           <span>Encrypted Feed</span>
        </div>
        <div className="flex items-center gap-3">
           <Activity className="w-4 h-4" />
           <span className="text-[9px] font-black uppercase tracking-[0.4em] text-center italic group cursor-help transition-all hover:tracking-[0.5em]">Real-time state synthesis protocol validated</span>
        </div>
      </footer>

      {/* Background Decorative Lines */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
    </div>
  );
}

export default App;