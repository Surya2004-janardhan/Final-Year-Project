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
    <div className="flex flex-col gap-8 p-10 bg-white border border-accent-sage rounded-2xl w-full max-w-md mx-auto">
      <div className="flex flex-col gap-1">
        <span className="text-label">Overview</span>
        <h3 className="text-xl font-bold">Analysis Results</h3>
      </div>
      
      <div className="relative w-full aspect-square flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* Base Hexagon Grid */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(65, 67, 27, 0.05)" strokeDasharray="4" />
          
          {/* Axis Lines */}
          {labels.map((_, i) => {
            const p = getCoordinates(i, 1);
            return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(65, 67, 27, 0.05)" />;
          })}

          {/* Minimal Polygon */}
          <motion.path
            initial={{ d: pathData }}
            animate={{ d: pathData }}
            transition={{ duration: 1 }}
            fill="rgba(65, 67, 27, 0.1)"
            stroke="var(--color-text-ink)"
            strokeWidth="2"
          />

          {/* Points */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="var(--color-text-ink)" />
          ))}

          {/* Labels */}
          {labels.map((label, i) => {
            const p = getCoordinates(i, 1.25);
            return (
              <text key={i} x={p.x} y={p.y} textAnchor="middle" className="fill-text-ink text-[8px] uppercase tracking-widest font-bold opacity-30">
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-6 border-t border-accent-sage/20">
        {labels.slice(0, 4).map((label) => (
          <div key={label} className="flex flex-col">
            <span className="text-label italic lowercase">{label}</span>
            <span className="text-sm font-bold">{(emotions ? (emotions[label.toLowerCase()] * 100).toFixed(1) : "0.0")}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmotionRadar;
