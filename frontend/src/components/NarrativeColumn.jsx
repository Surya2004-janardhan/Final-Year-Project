import React from 'react';
import { motion } from 'framer-motion';

const NarrativeColumn = ({ story, quote }) => {
  return (
    <div className="flex flex-col gap-12 p-16 bg-white border border-gray-100 rounded-3xl w-full max-w-2xl mx-auto shadow-sm">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-gray-400">Synthesis Report</span>
        <h3 className="text-3xl font-bold tracking-tight">Observations</h3>
      </div>

      <div className="space-y-12">
        {/* Narrative Text - Clean Typography Like Claude/Substack */}
        <p className="text-[20px] leading-[1.8] text-gray-700 font-medium font-sans">
          {story || "Statistical synthesis of visual and auditory sensory streams pending. Capture initiates new session."}
        </p>

        {quote && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            whileInView={{ opacity: 1, x: 0 }}
            className="pl-8 border-l border-black pt-2 pb-2"
          >
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest block mb-4 italic">Core Resonance</span>
            <p className="text-base text-black/60 font-semibold leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer Branding - Subtle Scientific Meta */}
      <div className="flex items-center gap-6 pt-12 border-t border-gray-100 opacity-20 text-[9px] font-bold uppercase tracking-widest">
         <span>Log Sync: 2026.03.01</span>
         <span>Hash: AE88-00X-FF</span>
         <div className="flex-1 text-right flex items-center justify-end gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-black" />
            <span>Authenticated Mapping</span>
         </div>
      </div>
    </div>
  );
};

export default NarrativeColumn;
