import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Play, Music, Youtube } from 'lucide-react';

const RecommendationGrid = ({ songs, video }) => {
  return (
    <div className="flex flex-col gap-12 w-full max-w-5xl mx-auto py-24 px-8 border-t border-gray-100 mt-24">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold tracking-[0.5em] text-gray-400">Curated Intelligence</span>
        <h3 className="text-3xl font-bold tracking-tight">Curation Grid</h3>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Songs Column - Clean Text List Like Substack/Scientific Journal */}
        <div className="space-y-6">
          <span className="text-[11px] uppercase font-extrabold text-black/20 tracking-widest block mb-4 italic">Audio Recommendations</span>
          <div className="space-y-4">
            {songs?.length > 0 ? (
              songs.map((song, i) => (
                <a
                  key={i}
                  href={song.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-6 bg-white border border-gray-100 rounded-2xl hover:border-black transition-all group shadow-sm hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center bg-gray-50 group-hover:bg-black group-hover:border-black transition-all">
                        <Music className="w-4 h-4 text-gray-400 group-hover:text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-gray-900 group-hover:underline">{song.title}</span>
                        <span className="text-[12px] uppercase tracking-widest text-gray-400 font-bold group-hover:text-black/40 transition-colors">{song.artist}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300" />
                  </div>
                </a>
              ))
            ) : (
              <div className="p-10 border border-dashed border-gray-200 rounded-2xl text-center bg-gray-50/50">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-300">Data awaiting synthesis</span>
              </div>
            )}
          </div>
        </div>

        {/* Video Column - Clean Geometric Grid */}
        <div className="space-y-6">
          <span className="text-[11px] uppercase font-extrabold text-black/20 tracking-widest block mb-4 italic">Video Insights</span>
          {video ? (
            <a
              href={video.link || 'https://youtube.com'}
              target="_blank"
              rel="noreferrer"
              className="block bg-gray-50 border border-gray-100 rounded-3xl overflow-hidden group hover:border-black transition-all aspect-[16/10] relative shadow-sm hover:shadow-2xl"
            >
               <div className="absolute inset-0 bg-white" />
               
               {/* Minimal Center Icon */}
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-16 h-16 rounded-full border border-black/5 bg-white/80 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                   <Play className="w-6 h-6 text-black fill-black/10" />
                 </div>
               </div>
               
               {/* Details Bottom Overlay */}
               <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-3 group-hover:translate-y-[-4px] transition-transform">
                 <div className="flex items-center gap-2">
                   <Youtube className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
                   <span className="text-[10px] uppercase tracking-widest font-bold text-gray-300 group-hover:text-black/40 transition-colors">Visual Resonance Sequence</span>
                 </div>
                 <h5 className="text-xl font-bold tracking-tight text-gray-900 leading-tight italic underline decoration-gray-200 underline-offset-8 group-hover:decoration-black transition-all">
                   {video.title || "Reflective Synthesis Guide"}
                 </h5>
               </div>
            </a>
          ) : (
             <div className="aspect-[16/10] border border-dashed border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50/50">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-300">Visual telemetry pending</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationGrid;
