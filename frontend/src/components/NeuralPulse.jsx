import React from "react";
import { motion } from "framer-motion";

const NeuralPulse = ({ isRecording, videoRef }) => {
  return (
    <div className="flex flex-col items-center gap-12 w-full max-w-xl mx-auto py-12">
      <div className="relative w-[340px] h-[340px] flex items-center justify-center">
        {/* Simple Pulsing Circle When Active */}
        {isRecording && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [1, 1.1, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 border border-black/10 rounded-full"
          />
        )}
        
        {/* High Precision Viewfinder */}
        <div className="relative w-full h-full rounded-full border border-black/5 bg-gray-50 flex items-center justify-center p-4 shadow-sm">
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover rounded-full filter saturate-0 brightness-[1.05] grayscale opacity-80"
          />
          
          {/* Subtle Scanning Indicator */}
          {isRecording && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full border border-black/5 shadow-lg z-20">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-black">Live Capture</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Detail Text */}
      <div className="flex flex-col items-center gap-2 opacity-30 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Optical Sensory Input</span>
        <div className="w-8 h-[1px] bg-black/10" />
      </div>
    </div>
  );
};

export default NeuralPulse;
