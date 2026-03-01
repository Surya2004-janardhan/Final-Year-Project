import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command } from "lucide-react";
import UploadSection from "./components/UploadSection";
import EmotionRadar from "./components/EmotionRadar";
import NarrativeColumn from "./components/NarrativeColumn";
import RecommendationGrid from "./components/RecommendationGrid";
import SystemTelemetry from "./components/SystemTelemetry";
import TimelineChart from "./components/TimelineChart";

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (isProcessing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => (prev < 98 ? prev + Math.floor(Math.random() * 3) + 1 : prev));
      }, 200);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

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
      setProgress(100);
    } catch (err) {
      setError("SESSION INTERRUPTED. RETRYING...");
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-white selection:text-black p-8 lg:p-12 relative font-sans">
      
      {/* ── Background Detail ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-mesh opacity-[0.15]" />
      <div className="glow-orb top-[10%] left-[20%] w-[500px] h-[500px]" />
      <div className="glow-orb bottom-[10%] right-[20%] w-[400px] h-[400px]" style={{ animationDelay: '4s' }} />

      {/* ── Header Area (Minimized Gap) ── */}
      <header className="flex flex-col items-center mb-8 max-w-7xl mx-auto py-10 relative z-10 text-center">
        <h1 className="text-6xl font-black tracking-tighter flex items-center gap-6">
           <Command className="w-12 h-12 opacity-10" /> 
           EMOTION AI
        </h1>
        <p className="text-[10px] font-extrabold text-white/10 uppercase tracking-[1.4rem] mt-3 ml-2">State Synthesis</p>
      </header>

      <main className="max-w-7xl mx-auto space-y-32 relative z-10">
        
        {/* Phase 1: Upload */}
        <section className="flex flex-col items-center">
          <UploadSection 
            onFileSelect={processVideo} 
            isProcessing={isProcessing} 
          />

          <AnimatePresence>
            {isProcessing && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full max-w-2xl flex flex-col items-center gap-12 mt-20"
              >
                <div className="w-full h-[0.5px] bg-white/5 relative overflow-hidden rounded-full">
                   <motion.div 
                     initial={{ width: '0%' }}
                     animate={{ width: `${progress}%` }}
                     className="absolute inset-y-0 left-0 bg-white"
                   />
                </div>
                <div className="text-white font-black italic tracking-tighter text-[48px] font-mono opacity-20">
                   {String(progress).padStart(2, '0')}
                </div>
              </motion.div>
            )}

            {error && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] font-black uppercase tracking-[0.5em] bg-red-500/5 px-8 py-3 rounded-full border border-red-500/10 mt-16 transition-all">
                  {error}
               </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Phase 2: Results Display */}
        <AnimatePresence>
          {results && !isProcessing && (
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="space-y-40 pb-32"
            >
              <SystemTelemetry results={results} />

              <div className="grid lg:grid-cols-2 gap-24 items-start pt-24 border-t border-white/5">
                <div className="space-y-32">
                   <EmotionRadar emotions={results.emotion_distribution} />
                   <TimelineChart data={results.timeline_data} />
                </div>
                <div className="lg:sticky lg:top-24">
                   <NarrativeColumn story={results.story} quote={results.quote} />
                </div>
              </div>

              <RecommendationGrid songs={results.songs} video={{ title: results.video, link: results.video }} />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* No Footer */}
    </div>
  );
}

export default App;