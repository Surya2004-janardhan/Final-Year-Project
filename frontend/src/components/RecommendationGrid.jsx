import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Play } from 'lucide-react';

const RecommendationGrid = ({ songs, video, healthInfo }) => {
  return (
    <div className="flex flex-col gap-12 w-full max-w-4xl mx-auto py-16">
      <div className="flex flex-col gap-2">
        <span className="text-label">Analysis Synthesis</span>
        <h3 className="text-xl font-bold">Recommendations & Guidance</h3>
      </div>

      {healthInfo && (
        <div className="grid md:grid-cols-2 gap-8">
           {/* Medical Guidance */}
           <div className="space-y-6">
              <div className="p-6 bg-white border border-accent-sage rounded-xl shadow-sm">
                <span className="text-label lowercase italic">Medical Treatments</span>
                <p className="text-sm mt-2 text-text-ink/80">{healthInfo.treatments}</p>
                <div className="mt-4 pt-4 border-t border-accent-sage/10">
                   <span className="text-label lowercase italic">Cost in India</span>
                   <p className="text-sm text-text-ink font-bold">{healthInfo.costs_india}</p>
                </div>
              </div>

              <div className="p-6 bg-stone-50 border border-accent-sage/50 rounded-xl">
                 <span className="text-label lowercase italic text-accent-sage">Support & Medicine</span>
                 <p className="text-[11px] leading-relaxed mt-2 text-text-ink/70 italic">{healthInfo.medicine}</p>
              </div>
           </div>

           {/* Diet & Exercise */}
           <div className="space-y-6">
              <div className="p-6 bg-white border border-accent-stroke rounded-xl border-accent-sage">
                 <span className="text-label lowercase italic">Dietary Lifestyle</span>
                 <p className="text-sm mt-2 font-medium text-text-ink/90">{healthInfo.diet}</p>
              </div>
              
              <div className="p-6 bg-white border border-accent-stroke rounded-xl border-accent-sage">
                 <span className="text-label lowercase italic">Exercises & Yoga</span>
                 <p className="text-sm mt-2 text-text-ink/80">{healthInfo.exercise}</p>
              </div>
           </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Songs Column */}
        <div className="space-y-4">
          <span className="text-label lowercase italic">Healing Sounds</span>
          <div className="space-y-4">
            {songs?.length > 0 ? (
              songs.map((song, i) => (
                <a
                  key={i}
                  href={song.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-4 bg-white border border-accent-sage rounded-xl hover:border-text-ink transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{song.title}</span>
                      <span className="text-[10px] uppercase tracking-widest opacity-40">{song.artist}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-text-ink/40" />
                  </div>
                </a>
              ))
            ) : (
              <div className="p-8 border-2 border-dashed border-accent-sage/20 rounded-xl text-center">
                <span className="text-label text-[10px]">Data incoming...</span>
              </div>
            )}
          </div>
        </div>

        {/* Video Column */}
        <div className="space-y-4">
          <span className="text-label lowercase italic">Educational Care</span>
          {video ? (
            <a
              href={video.link || 'https://youtube.com'}
              target="_blank"
              rel="noreferrer"
              className="block bg-white border border-accent-sage rounded-xl overflow-hidden group hover:border-text-ink transition-all aspect-[16/10] relative"
            >
               <div className="absolute inset-0 bg-stone-100" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-12 h-12 rounded-full border border-text-ink/10 flex items-center justify-center">
                   <Play className="w-4 h-4 text-text-ink" />
                 </div>
               </div>
               <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-1 px-2">
                 <h5 className="text-sm font-bold italic underline decoration-accent-sage underline-offset-4 line-clamp-1">{video.title || "Eye Care Guide"}</h5>
                 <span className="text-[10px] opacity-40 uppercase tracking-widest font-bold">Watch Visual Explanation</span>
               </div>
            </a>
          ) : (
             <div className="aspect-[16/10] border-2 border-dashed border-accent-sage/20 rounded-xl flex items-center justify-center">
                <span className="text-label text-[10px]">Awaiting visual data...</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationGrid;
