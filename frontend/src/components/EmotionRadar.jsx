import React from 'react';
import { motion } from 'framer-motion';

const EmotionRadar = ({ emotions }) => {
  const labels = ['Joy', 'Surprise', 'Neutral', 'Disgust', 'Fear', 'Anger', 'Sadness'];
  const size = 300;
  const center = size / 2;
  const radius = size * 0.4;

  const getCoordinates = (index, value) => {
    const angle = (Math.PI * 2 * index) / labels.length - Math.PI / 2;
    const x = center + radius * value * Math.cos(angle);
    const y = center + radius * value * Math.sin(angle);
    return { x, y };
  };

  const points = labels.map((label, i) => {
    const value = emotions ? emotions[label.toLowerCase()] || 0.1 : 0.2;
    return getCoordinates(i, value);
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="flex flex-col gap-10 p-12 bg-white border border-gray-100 rounded-3xl w-full max-w-md mx-auto shadow-sm group">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Spectral Analysis</span>
        <h3 className="text-2xl font-bold tracking-tight">Emotional Spectrum</h3>
      </div>
      
      <div className="relative w-full aspect-square flex items-center justify-center py-6">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* Base Grid - Single Subtle Circle */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" strokeDasharray="3" />
          
          {/* Axis Lines - Minimal High Contrast */}
          {labels.map((_, i) => {
            const p = getCoordinates(i, 1);
            return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(0, 0, 0, 0.05)" strokeWidth="0.5" />;
          })}

          {/* Minimal Polygon - Clean Black Outlines */}
          <motion.path
            initial={{ d: pathData }}
            animate={{ d: pathData }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            fill="rgba(0, 0, 0, 0.03)"
            stroke="black"
            strokeWidth="1.5"
          />

          {/* Detailed Indicator Dots */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="black" />
          ))}

          {/* Labels - Clean Mono Serif/Sans */}
          {labels.map((label, i) => {
            const p = getCoordinates(i, 1.25);
            return (
              <text key={i} x={p.x} y={p.y} textAnchor="middle" className="text-[10px] font-bold fill-black/30 group-hover:fill-black/60 transition-colors uppercase tracking-widest">
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-8 border-t border-gray-100">
        {labels.slice(0, 4).map((label) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider italic">{label}</span>
            <span className="text-xl font-bold font-mono">{(emotions ? (emotions[label.toLowerCase()] * 100).toFixed(1) : "0.0")}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmotionRadar;
