import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShieldCheck, RefreshCcw } from "lucide-react";
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
    <div className="min-h-screen p-8 lg:p-20 relative">
      <div className="fixed inset-0 bg-paper -z-20" />
      
      <header className="flex justify-between items-center mb-24 max-w-6xl mx-auto">
        <div className="flex flex-col">
          <h1 className="text-sm font-bold tracking-[0.3em] uppercase">EmotionAI</h1>
          <span className="text-[8px] opacity-30 mt-1 uppercase tracking-widest font-bold">Statistical Mapping // 2026</span>
        </div>

        <div className="flex items-center gap-2 border border-accent-sage pr-4 pl-2 py-1.5 rounded-full">
           <div className={`w-3 h-3 rounded-full flex items-center justify-center`}>
              <div className={`w-1 h-1 rounded-full ${isProcessing ? 'bg-text-ink animate-pulse' : 'bg-accent-sage/20'}`} />
           </div>
           <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">
             {isProcessing ? 'Processing' : 'System Ready'}
           </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-40">
        
        {/* Recording Section */}
        <section className="flex flex-col items-center gap-12">
          <NeuralPulse 
            isRecording={isRecording} 
            videoRef={videoRef} 
          />
          
          <button
            onClick={startRecording}
            disabled={isRecording || isProcessing}
            className={`px-10 py-4 bg-text-ink text-paper rounded-full text-[10px] font-bold uppercase tracking-[0.4em] transition-all hover:scale-105 active:scale-95 disabled:opacity-20`}
          >
            {isRecording ? 'Capturing...' : 'Start Recording'}
          </button>
          
          <AnimatePresence>
            {error && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-700 text-[10px] font-bold uppercase tracking-widest">
                  <Activity className="w-3 h-3" /> {error}
               </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Results Section */}
        <AnimatePresence>
          {results && !isProcessing && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid lg:grid-cols-2 gap-20"
            >
              <EmotionRadar emotions={results.emotion_distribution} />
              <NarrativeColumn story={results.story} quote={results.quote} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Recommendations Section */}
        <AnimatePresence>
          {results && !isProcessing && (
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <RecommendationGrid songs={results.songs} video={{ title: results.video, link: results.video }} />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-40 pt-12 border-t border-accent-sage/20 flex flex-col md:flex-row justify-between items-center gap-8 max-w-6xl mx-auto opacity-20">
        <div className="flex items-center gap-6 text-[8px] font-bold uppercase tracking-[0.4em]">
           <span>Active State</span>
           <div className="w-1 h-1 bg-text-ink rounded-full" />
           <span>2026</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[8px] font-bold uppercase tracking-widest text-center italic">Highly curated statistical emotional analysis</span>
        </div>
      </footer>
    </div>
  );
}

export default App;