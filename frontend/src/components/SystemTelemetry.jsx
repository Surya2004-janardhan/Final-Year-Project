import React from 'react';
import { motion } from 'framer-motion';

const SystemTelemetry = ({ results }) => {
  if (!results) return null;

  const stats = [
    { label: 'Stability', value: (results.emotional_stability * 100).toFixed(1) + '%' },
    { label: 'Confidence', value: (results.timeline_confidence * 100).toFixed(1) + '%' }
  ];

  return (
    <div className="flex flex-col gap-12 w-full">
      <div className="flex items-center gap-4 opacity-10">
        <span className="text-[10px] font-black uppercase tracking-[0.6em]">System Indicators</span>
        <div className="flex-1 h-[0.5px] bg-white/10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-4">
               <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">{stat.label}</span>
               <div className="flex-1 h-[0.5px] bg-white/5" />
            </div>
            <span className="text-4xl font-black text-white">{stat.value}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SystemTelemetry;
