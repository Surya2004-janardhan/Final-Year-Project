import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload } from 'lucide-react';

const UploadSection = ({ onFileSelect, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative group">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`glass-surface relative flex flex-col items-center justify-center p-20 h-[380px] transition-all cursor-pointer overflow-hidden
          ${dragActive ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/20'}
          ${isProcessing ? 'pointer-events-none opacity-20 filter blur-sm' : ''}
        `}
        onClick={() => !isProcessing && document.getElementById("file-upload").click()}
      >
        <input 
          id="file-upload" 
          type="file" 
          className="hidden" 
          accept="video/*" 
          onChange={handleFileChange}
        />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-700">
             <Upload className="w-6 h-6 text-white/40" />
          </div>
          
          <div className="flex flex-col items-center gap-2 text-center">
             <h3 className="text-3xl font-extrabold tracking-tighter text-white">Upload Media</h3>
             <p className="text-xs font-bold text-white/20 tracking-[0.2em] uppercase">Select 11s video for analysis</p>
          </div>
        </div>
        
        {/* Decorative Internal Glass Elements */}
        <div className="absolute top-0 left-0 w-24 h-24 border-t border-l border-white/5 pointer-events-none rounded-tl-3xl" />
        <div className="absolute bottom-0 right-0 w-24 h-24 border-b border-r border-white/5 pointer-events-none rounded-br-3xl" />
      </motion.div>
    </div>
  );
};

export default UploadSection;
