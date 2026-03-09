import { useState, useRef, useEffect } from 'react';
import { Upload, Video, Camera, StopCircle, RotateCcw } from 'lucide-react';

export default function RecordingPanel({
  recorder,
  onAnalyze,
  isProcessing,
}) {
  const [mode, setMode] = useState('upload');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const fileInputRef = useRef(null);

  const {
    isRecording,
    countdown,
    hasPermission,
    videoRef,
    requestPermission,
    startRecording,
    stopRecording,
    stopStream,
  } = recorder;

  useEffect(() => {
    if (mode === 'live') {
      requestPermission();
    } else {
      stopStream();
    }
  }, [mode]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) { setUploadedFile(file); setRecordingBlob(null); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) { setUploadedFile(file); setRecordingBlob(null); }
  };

  const handleRecord = async () => {
    if (isRecording) { stopRecording(); }
    else {
      setRecordingBlob(null);
      const blob = await startRecording();
      if (blob) setRecordingBlob(blob);
    }
  };

  const handleAnalyze = () => {
    if (mode === 'upload' && uploadedFile) onAnalyze(uploadedFile, 'file');
    else if (mode === 'live' && recordingBlob) onAnalyze(recordingBlob, 'blob');
  };

  const canAnalyze = (mode === 'upload' && uploadedFile) || (mode === 'live' && recordingBlob && !isRecording);

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-up">
      {/* Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex glass rounded-lg p-1 gap-1">
          <button
            onClick={() => { setMode('upload'); setRecordingBlob(null); }}
            className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
              mode === 'upload'
                ? 'bg-primary/20 text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <button
            onClick={() => { setMode('live'); setUploadedFile(null); }}
            className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
              mode === 'live'
                ? 'bg-primary/20 text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            }`}
          >
            <Camera className="w-4 h-4" />
            Live
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="relative">
        {mode === 'upload' && (
          <div
            className={`glass glow-border rounded-xl p-12 text-center transition-all duration-200 cursor-pointer border-dashed border-2 ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border-subtle'
            }`}
            onClick={() => { if (!uploadedFile) fileInputRef.current?.click(); }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {uploadedFile ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center bg-primary/10">
                  <Video className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-text-primary font-semibold text-lg">{uploadedFile.name}</p>
                  <p className="text-text-secondary text-sm">{(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Replace video
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center bg-surface-raised">
                  <Upload className="w-8 h-8 text-text-muted" />
                </div>
                <div>
                  <p className="text-text-primary font-medium text-lg">
                    Select a video to analyze
                  </p>
                  <p className="text-text-secondary text-sm mt-1 mb-4">or drag and drop files here</p>
                  <div className="inline-block px-4 py-1.5 rounded-md border border-border-strong text-xs text-text-muted">
                    MP4, WebM, AVI • Max 100MB
                  </div>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {mode === 'live' && (
          <div className="glass glow-border rounded-xl overflow-hidden max-w-md mx-auto">
            <div className="relative bg-surface-base flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
              {hasPermission ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className="text-center space-y-3 p-8">
                  <div className="w-12 h-12 mx-auto rounded-full bg-surface-raised flex items-center justify-center">
                    <Camera className="w-6 h-6 text-text-muted" />
                  </div>
                  <p className="text-text-secondary text-sm">Awaiting camera access...</p>
                </div>
              )}

              {/* Overlays */}
              {isRecording && (
                <>
                   <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                   <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-md bg-black/60 backdrop-blur-md">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">Session Live</span>
                  </div>
                </>
              )}

              {isRecording && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-lg border border-primary/30">
                    <span className="text-3xl font-bold text-primary tabular-nums drop-shadow-lg">{countdown}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 flex flex-col items-center gap-4">
              {!isRecording ? (
                <button
                  onClick={handleRecord}
                  disabled={!hasPermission}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-primary text-bg-base font-bold text-sm transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Start Capture
                  <span className="opacity-70 font-medium">(11s)</span>
                </button>
              ) : (
                <button
                  onClick={handleRecord}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-red-500 text-white font-bold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <StopCircle className="w-4 h-4" />
                  Terminate Session
                </button>
              )}

              {recordingBlob && !isRecording && (
                <p className="text-sm font-medium text-primary flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-primary" />
                   Temporal segment captured
                </p>
              )}

              <p className="text-[10px] text-text-muted text-center leading-relaxed max-w-xs">
                Camera data and audio streams are processed locally for privacy. 
                Lighting and resolution may influence final analytical confidence.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Analyze Button */}
      <div className="mt-10 flex flex-col items-center gap-4">
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || isProcessing}
          className={`
            relative group px-12 py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-300
            ${canAnalyze && !isProcessing 
              ? 'bg-gradient-to-r from-primary to-primary-light text-bg-base shadow-xl shadow-primary/25 cursor-pointer hover:-translate-y-1 hover:shadow-primary/40' 
              : 'bg-surface-raised text-text-muted cursor-not-allowed opacity-50'}
            overflow-hidden
          `}
        >
          <span className="relative z-10">Run Cognitive Analysis</span>
          {canAnalyze && !isProcessing && (
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          )}
        </button>
        
        {!canAnalyze && !isProcessing && (
          <span className="text-xs text-text-muted animate-pulse">Awaiting input stream...</span>
        )}
      </div>
    </div>
  );
}
