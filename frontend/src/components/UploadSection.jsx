import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Plus, Target } from 'lucide-react';

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
      {/* Target Marker Decoration (Fancy Addition) */}
      <div className="absolute top-[-20px] left-[-20px] opacity-10 group-hover:opacity-40 transition-opacity">
         <Target className="w-10 h-10 text-white" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`glass-panel relative flex flex-col items-center justify-center p-24 h-[420px] transition-all cursor-pointer overflow-hidden
          ${dragActive ? 'border-white/40 bg-white/5' : 'border-white/5 hover:border-white/10'}
          ${isProcessing ? 'pointer-events-none opacity-10' : ''}
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

        {/* Fancy Background Decoration in Hub */}
        <div className="absolute inset-0 opacity-[0.02] flex items-center justify-center pointer-events-none">
           <div className="w-[600px] h-[600px] border border-white rounded-full scale-[1.5] animate-pulse" />
           <div className="w-[400px] h-[400px] border border-white rounded-full scale-[1.2] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-12">
          {/* Main Visual Handle */}
          <div className="relative">
             <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-1000">
                <Upload className="w-8 h-8 text-white/40 group-hover:text-white transition-colors" />
             </div>
             {/* Simple Floating Plus markers */}
             <Plus className="absolute top-[-5px] right-[-5px] w-4 h-4 opacity-20 animate-bounce" />
             <Plus className="absolute bottom-[-5px] left-[-5px] w-4 h-4 opacity-20" />
          </div>
          
          <div className="flex flex-col items-center gap-4 text-center">
             <h3 className="text-4xl font-extrabold tracking-tight text-white italic group-hover:tracking-widest transition-all duration-1000">UPLOAD</h3>
             <div className="w-12 h-[1px] bg-white opacity-10 group-hover:opacity-40 transition-all duration-1000" />
          </div>
        </div>
        
        {/* Detail Meta around corners */}
        <div className="absolute bottom-8 left-8 flex items-center gap-2 opacity-5">
           <div className="w-1 h-1 bg-white rounded-full" />
           <span className="text-[7px] font-black tracking-widest uppercase">Select media file</span>
        </div>
        <div className="absolute bottom-8 right-8 flex items-center gap-2 opacity-5">
           <span className="text-[7px] font-black tracking-widest uppercase">Limit: 11s/60MB</span>
        </div>
      </motion.div>
    </div>
  );
};

export default UploadSection;
