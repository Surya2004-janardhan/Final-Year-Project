import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command, Activity } from "lucide-react";
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

  // Enhanced progress polling
  useEffect(() => {
    let interval;
    if (isProcessing) {
      interval = setInterval(async () => {
        try {
          const response = await fetch("http://localhost:5000/status");
          const data = await response.json();
          setProgress(data.progress);
          if (data.progress >= 100) clearInterval(interval);
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 500);
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
      // Start the process, but we rely on polling for progress
      const response = await fetch("http://localhost:5000/process", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResults(data);
    } catch (err) {
      setError("SESSION INTERRUPTED. RETRYING...");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black p-8 lg:p-16 relative font-sans overflow-hidden">
      
      {/* ── HIGH-END DECORATIVE DECOR ── */}
      <div className="bg-noise" />
      <div className="bg-graticule" />
      <div className="float-orb top-[-20%] left-[-10%] w-[800px] h-[800px]" />
      <div className="float-orb bottom-[-20%] right-[-10%] w-[600px] h-[600px]" style={{ animationDelay: '4s' }} />

      <header className="flex flex-col items-center mb-16 max-w-7xl mx-auto py-12 relative z-10 text-center">
        <h1 className="text-7xl font-black tracking-tighter flex items-center gap-8 group cursor-default">
           <Command className="w-14 h-14 opacity-20 group-hover:rotate-180 transition-transform duration-1000 ease-out" /> 
           EMOTION AI
        </h1>
      </header>

      <main className="max-w-7xl mx-auto space-y-32 relative z-10 pb-48">
        
        {/* PHASE 1: UPLOAD */}
        <section className="flex flex-col items-center">
          <UploadSection 
            onFileSelect={processVideo} 
            isProcessing={isProcessing} 
          />

          <AnimatePresence>
            {isProcessing && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                className="w-full max-w-2xl flex flex-col items-center gap-10 mt-16"
              >
                {/* More Visible Horizontal Loader */}
                <div className="w-full space-y-4">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Analyzing Sequence</span>
                    <span className="text-2xl font-black italic text-white">{progress}%</span>
                  </div>
                  <div className="w-full h-[3px] bg-white/5 relative overflow-hidden rounded-full">
                    <motion.div 
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      className="absolute inset-y-0 left-0 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 text-red-500 text-[10px] font-black uppercase tracking-[0.5em] bg-red-500/5 px-8 py-3 rounded-full border border-red-500/10 mt-16">
                  {error}
               </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* SIMPLE DOTTED DIVISIONS */}
        <div className="w-full border-t border-dashed border-white/10 my-16" />

        {/* PHASE 2: RESULTS */}
        <AnimatePresence>
          {results && !isProcessing && (
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-40 pb-20"
            >
              <SystemTelemetry results={results} />
              
              <div className="w-full border-t border-dashed border-white/10 my-12" />

              <div className="grid lg:grid-cols-2 gap-32 items-start">
                <div className="space-y-40">
                   <EmotionRadar emotions={results.emotion_distribution} />
                   <div className="w-full border-t border-dashed border-white/5 my-8" />
                   <TimelineChart data={results.timeline_data} />
                </div>
                <div className="lg:sticky lg:top-24">
                   <NarrativeColumn story={results.story} quote={results.quote} />
                </div>
              </div>

              <div className="w-full border-t border-dashed border-white/10 my-24" />
              <RecommendationGrid songs={results.songs} video={{ title: results.video, link: results.video }} />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Decorative Marks */}
      <div className="fixed top-20 right-20 text-[8px] font-bold opacity-10 flex flex-col z-50">
         <span>40.7128° N</span>
         <span>74.0060° W</span>
      </div>
      <div className="fixed bottom-20 left-20 text-[8px] font-bold opacity-10 flex flex-col z-50">
         <span>SIDERIAL_STATE</span>
         <span>INDEX_00X_FF</span>
      </div>
    </div>
  );
}

export default App;