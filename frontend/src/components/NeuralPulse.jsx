import React from 'react';
import { motion } from 'framer-motion';

const NeuralPulse = ({ isRecording, videoRef }) => {
  return (
    <div className="flex flex-col items-center gap-12 w-full max-w-lg mx-auto">
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* Simple Pulsing Outer Border */}
        {isRecording && (
          <div className="absolute inset-0 pulse-ring pointer-events-none" />
        )}
        
        {/* High Contrast Viewfinder */}
        <div className="relative w-64 h-64 rounded-full border-2 border-text-ink overflow-hidden bg-white shadow-xl">
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover filter grayscale"
          />
          
          {/* Scan Line - Minimalist Version */}
          {isRecording && (
            <motion.div 
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-[2px] bg-text-ink/20 z-10"
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 py-2 px-6 border border-accent-sage rounded-full bg-white/50 backdrop-blur-sm">
        <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-text-ink' : 'bg-accent-sage/30'}`} />
        <span className="text-label">
          {isRecording ? 'Capturing...' : 'Ready'}
        </span>
      </div>
    </div>
  );
};

export default NeuralPulse;
