import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Video,
  Play,
  Pause,
  Loader2,
  Heart,
  Brain,
  Music,
  BookOpen,
  Youtube,
  Sparkles,
  Zap,
  TrendingUp,
  Activity,
  X,
  User,
  Mic,
  ArrowRight,
  Headphones,
  CheckCircle2,
  Cpu,
  Layers,
  Globe,
  Waves,
  ScanText,
  ScanEye,
  Volume2
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { gsap } from "gsap";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ErrorBoundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f7f2] flex flex-col items-center justify-center p-8 text-center font-['Outfit']">
          <div className="gallery-card max-w-lg border-black/10">
            <h1 className="text-3xl font-bold text-black mb-4">SYSTEM RESTRICTION</h1>
            <p className="text-gray-500 mb-8 lowercase tracking-wide font-medium">{this.state.error?.toString()}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-nordic mx-auto"
            >
              RESTORE INTERFACE
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [showStoryModal, setShowStoryModal] = useState(false);

  const emotionColors = {
    neutral: "#6b7280",
    happy: "#d97706",
    sad: "#2563eb",
    angry: "#dc2626",
    fearful: "#7c3aed",
    disgust: "#059669",
    surprised: "#ea580c"
  };

  const emotions = ["neutral", "happy", "sad", "angry", "fearful", "disgust", "surprised"];

  const [loaderPercent, setLoaderPercent] = useState(0);
  const [showLoader, setShowLoader] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Initializing...");

  useEffect(() => {
    let interval;
    if (isProcessing) {
      setShowLoader(true);
      setLoaderPercent(0);
      const start = Date.now();
      interval = setInterval(() => {
        const elapsed = (Date.now() - start) / 1000;
        
        // Dynamic status updates based on typical processing time
        if (elapsed < 12) {
          setProcessingStatus("DECODING VIDEO STREAM...");
          setLoaderPercent(Math.min(30, Math.floor((elapsed / 12) * 30)));
        } else if (elapsed < 16) {
          setProcessingStatus("EXTRACTING AUDITORY VECTORS...");
          setLoaderPercent(Math.min(60, 30 + Math.floor(((elapsed - 12) / 6) * 30)));
        } else if (elapsed < 22) {
          setProcessingStatus("NEURAL FUSION IN PROGRESS...");
          setLoaderPercent(Math.min(90, 60 + Math.floor(((elapsed - 16) / 6) * 30)));
        } else if (elapsed < 29) {
          setProcessingStatus("AI CONTENT SYNTHESIS...");
          setLoaderPercent(Math.min(98, 90 + Math.floor(((elapsed - 22) / 7) * 8)));
        } else {
          setLoaderPercent(99);
          setProcessingStatus("FINALIZING...");
        }
      }, 100);
    } else {
      setShowLoader(false);
      setProcessingStatus("DONE");
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const [recordError, setRecordError] = useState("");
  const [recordCountdown, setRecordCountdown] = useState(11);

  useEffect(() => {
    let countdownInterval;
    if (isRecording) {
      setRecordCountdown(11);
      countdownInterval = setInterval(() => {
        setRecordCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(countdownInterval);
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && recordCountdown === 0) stopRecording();
  }, [recordCountdown, isRecording]);

  const startRecording = async () => {
    setRecordError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: true,
      });
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        await processVideo(blob);
        chunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      setRecordError("HARDWARE ACCESS RESTRICTED");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) setUploadedFile(file);
  };

  const processVideo = async (videoBlob) => {
    if (!videoBlob) return;
    setIsProcessing(true);
    setResults(null);
    const formData = new FormData();
    formData.append("video", videoBlob, "capture.webm");

    try {
      const response = await fetch("/api/process", { method: "POST", body: formData });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Link failure:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#111827", font: { family: 'Inter', size: 11, weight: 600 }, usePointStyle: true, padding: 15 },
      },
      tooltip: {
        backgroundColor: "#111827",
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 6
      },
    },
    scales: {
      y: { 
        min: 0, max: 1, 
        grid: { color: "#f3f4f6" }, 
        ticks: { color: "#6b7280", font: { family: 'Inter', size: 11 } } 
      },
      x: { 
        grid: { display: false }, 
        ticks: { color: "#6b7280", font: { family: 'Inter', size: 11 } } 
      },
    },
    elements: {
      line: { tension: 0.4, borderWidth: 2, capStyle: 'round' },
      point: { radius: 0, hoverRadius: 4 },
    },
  };

  const createChartData = (probs = []) => ({
    labels: Array.isArray(probs) ? probs.map((_, i) => `${i}s`) : [],
    datasets: emotions.map((emotion, idx) => ({
      label: emotion,
      data: Array.isArray(probs) ? probs.map((p) => (Array.isArray(p) ? p[idx] : 0)) : [],
      borderColor: emotionColors[emotion] || "#cbd5e1",
      backgroundColor: `${emotionColors[emotion] || "#cbd5e1"}10`,
      fill: true,
    })),
  });

  return (
    <ErrorBoundary>
      <div className="min-h-screen relative selection:bg-black/10">
        <div className="noise-overlay" aria-hidden="true" />
        <motion.div className="fixed top-0 left-0 right-0 h-1 bg-black z-[100] origin-left" style={{ scaleX }} />

        <div className="relative z-10 flex flex-col py-16">
          {/* Minimal Header */}
          <header className="flex flex-col items-center text-center px-6 mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="uppercase-tracking text-[11px] mb-4 flex items-center gap-2 justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-text-main" /> Cortex Engine v5.0
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
                EmotionAI
              </h1>
              <p className="text-lg md:text-xl text-text-secondary font-serif-luxe max-w-xl mx-auto leading-relaxed italic">
                A minimalist protocol for human emotional synthesis.
              </p>
            </motion.div>
          </header>

          <main className="bento-container items-stretch">
            {/* Main Control Bento */}
            <motion.section 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-12"
            >
              <div className="gallery-card h-full flex flex-col p-10">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-border-subtle">
                  <h2 className="text-xl flex items-center gap-3"><ScanEye className="w-5 h-5 text-text-secondary" /> 01 // Capture</h2>
                  <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-border-strong" />
                    <span className="uppercase-tracking">System Ready</span>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-10 flex-1">
                  {/* Media Upload */}
                  <div className="flex flex-col gap-6">
                    <div className="group relative h-64 rounded-2xl bg-bg-sidebar border border-border-subtle flex items-center justify-center transition-all hover:bg-white overflow-hidden shadow-sm">
                      <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} accept="video/*" />
                      <label htmlFor="file-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-8 text-center">
                        <Upload className="w-10 h-10 text-text-muted mb-4 transition-transform group-hover:-translate-y-1" />
                        <span className="font-bold text-[16px] mb-2 text-text-main">Upload Archive</span>
                        <span className="text-[11px] text-text-muted uppercase tracking-widest font-bold">MPEG // WEBM // MP4</span>
                      </label>
                      {uploadedFile && (
                        <div className="absolute bottom-6 inset-x-6 bg-white p-3 rounded-xl border border-border-subtle text-[11px] font-bold flex items-center justify-between shadow-lg">
                           <span className="truncate pr-4 text-text-main">{uploadedFile.name}</span>
                           <CheckCircle2 className="w-4 h-4 text-accent-teal" />
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => processVideo(uploadedFile)}
                      disabled={!uploadedFile || isProcessing}
                      className="btn-nordic w-full py-4 text-[15px]"
                    >
                      {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />} Analyze Signal
                    </button>
                  </div>

                  {/* Live Feed */}
                  <div className="flex flex-col gap-6">
                    <div className="h-64 rounded-2xl bg-bg-sidebar border border-border-subtle overflow-hidden relative group shadow-sm">
                      <AnimatePresence>
                        {isRecording && (
                          <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-border-subtle shadow-lg"
                          >
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-text-main">REC 0:{recordCountdown < 10 ? `0${recordCountdown}` : recordCountdown}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <video ref={videoRef} className="w-full h-full object-cover grayscale opacity-90 transition-all group-hover:grayscale-0 group-hover:opacity-100" autoPlay playsInline muted />
                      {!isRecording && !videoRef.current?.srcObject && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-clay/20 backdrop-blur-sm">
                          <Video className="w-10 h-10 text-text-muted mb-3 opacity-40" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Sensor Inactive</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={startRecording} 
                        disabled={isRecording || isProcessing}
                        className="flex-1 btn-nordic btn-outline py-4 text-[15px]"
                      >
                         <Mic className="w-5 h-5" /> Start Feed
                      </button>
                      <button 
                        onClick={stopRecording}
                        disabled={!isRecording}
                        className="px-6 rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition-all shadow-sm"
                      >
                        <Pause className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>


            {/* Optimized Processing Display */}
            <AnimatePresence>
              {showLoader && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="col-span-12"
                >
                  <div className="gallery-card py-16 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-4 mb-4">
                      {loaderPercent < 30 ? <ScanEye className="w-5 h-5 text-text-main animate-pulse" /> : 
                       loaderPercent < 60 ? <Volume2 className="w-5 h-5 text-text-main animate-pulse" /> : 
                       loaderPercent < 90 ? <Zap className="w-5 h-5 text-text-main animate-pulse" /> : 
                       <CheckCircle2 className="w-5 h-5 text-accent-teal" />}
                      <span className="text-xs font-bold tracking-[0.3em] uppercase transition-all duration-500 text-text-main">
                        {processingStatus}
                      </span>
                    </div>
                    
                    <div className="w-full max-w-md">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[11px] font-bold text-text-muted uppercase">Neural Progress</span>
                        <span className="text-xl font-bold font-mono text-text-main">{loaderPercent}%</span>
                      </div>
                      <div className="loading-bar-container">
                        <motion.div 
                          className="loading-bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${loaderPercent}%` }}
                        />
                      </div>
                    </div>
                    
                    <p className="mt-8 text-[11px] text-text-muted italic max-w-xs">
                      Optimizing computational shards for {processingStatus.toLowerCase()}...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Results Presentation Area */}
          <AnimatePresence>
            {results && !results.error && !isProcessing && (
              <motion.section 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="bento-container"
              >
                {/* Result Summary */}
                <div className="col-span-12 gallery-card bg-white">
                   <div className="flex justify-between items-center mb-10 border-b border-border-subtle pb-8">
                      <h2 className="text-3xl font-bold tracking-tight text-text-main">02 // Synthesis</h2>
                      <div className="flex items-center gap-3 bg-bg-sidebar px-5 py-2 rounded-full border border-border-subtle shadow-sm">
                        <Activity className="w-4 h-4 text-accent-teal" />
                        <span className="text-[11px] font-bold tracking-widest uppercase text-text-secondary">Stream Optimized</span>
                      </div>
                   </div>
                   <div className="grid md:grid-cols-3 gap-8 mb-12">
                      {[
                        { label: "Vocal Layer", val: results?.audio_emotion || '...', icon: Volume2, status: "Channel_01" },
                        { label: "Visual Layer", val: results?.video_emotion || '...', icon: ScanEye, status: "Channel_02" },
                        { label: "Consensus", val: results?.fused_emotion || '...', icon: Brain, status: "Final_Fusion", highlight: true }
                       ].map((card, i) => (
                        <div key={i} className={`flex flex-col items-center p-8 rounded-[24px] border ${card.highlight ? 'bg-bg-sidebar border-border-strong' : 'bg-white border-border-subtle'} transition-all hover:shadow-md`}>
                           <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-6">{card.status}</span>
                           <div 
                             className="emotion-blob w-20 mb-6"
                             style={{ background: card.highlight ? `${emotionColors[card.val] || '#efebe4'}15` : '#f3f4f6' }}
                           >
                              <card.icon className={`w-8 h-8 ${card.highlight ? 'text-text-main' : 'text-text-muted'}`} />
                           </div>
                           <span className="text-[12px] font-bold text-text-muted mb-2 uppercase tracking-tighter">{card.label}</span>
                           <div className={`text-2xl font-bold lowercase ${card.highlight ? 'text-text-main' : 'text-text-secondary'}`}>{card.val}</div>
                        </div>
                      ))}
                   </div>

                   <div className="p-12 rounded-[32px] bg-bg-sidebar/50 border border-border-subtle text-center shadow-inner mx-4 mb-4">
                      <p className="text-xl md:text-3xl font-serif-luxe text-text-main leading-relaxed italic">
                        "{results.reasoning}"
                      </p>
                   </div>
                </div>

                {/* Comparative Analysis Graphs */}
                <div className="col-span-12 lg:col-span-6 gallery-card h-[480px] p-12">
                   <h3 className="text-xl font-bold mb-8 flex justify-between items-center border-b border-border-subtle pb-6 tracking-tight text-text-main">
                      <span>Vocal Trajectory</span>
                      <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-black">Temporal Log</span>
                   </h3>
                    <div className="h-[320px]">
                       {Array.isArray(results?.audio_probs_temporal) && results.audio_probs_temporal.length > 0 ? (
                         <Line data={createChartData(results.audio_probs_temporal)} options={chartOptions} />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-40 italic">
                          <Activity className="w-10 h-10 mb-2" />
                          <span className="text-[10px] font-bold uppercase">Signal Interrupt</span>
                        </div>
                      )}
                   </div>
                </div>

                <div className="col-span-12 lg:col-span-6 gallery-card h-[480px] p-12">
                   <h3 className="text-xl font-bold mb-8 flex justify-between items-center border-b border-border-subtle pb-6 tracking-tight text-text-main">
                      <span>Facial Geometry</span>
                      <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-black">Flow Analysis</span>
                   </h3>
                   <div className="h-[320px]">
                      {results?.video_probs_temporal?.length > 0 ? (
                        <Line data={createChartData(results.video_probs_temporal)} options={chartOptions} />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-40 italic">
                          <Activity className="w-10 h-10 mb-2" />
                          <span className="text-[10px] font-bold uppercase">Signal Interrupt</span>
                        </div>
                      )}
                   </div>
                </div>

                {/* Narrative Bento Area */}
                <div className="col-span-12 pt-16">
                   <div className="flex items-center gap-6 mb-16">
                      <div className="h-px bg-border-subtle flex-1" />
                      <h2 className="text-3xl font-bold tracking-tight text-text-muted">03 // Narratives</h2>
                      <div className="h-px bg-border-subtle flex-1" />
                   </div>

                   <div className="grid lg:grid-cols-12 gap-8 items-start">
                      <div className="lg:col-span-7 flex flex-col gap-8">
                         <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} className="gallery-card bg-bg-sidebar p-12">
                            <h4 className="flex items-center gap-4 text-[17px] font-bold mb-8 text-text-main"><BookOpen className="w-5 h-5 text-text-muted" /> The Story</h4>
                            <p className="text-xl font-serif-luxe leading-relaxed text-text-secondary italic">
                               {results?.story ? `${results.story.split(' ').slice(0, 30).join(' ')}...` : "Narrative analysis pending..."}
                            </p>
                            <button 
                              onClick={() => setShowStoryModal(true)}
                              disabled={!results?.story}
                              className="mt-10 text-[12px] font-bold uppercase tracking-[0.2em] text-text-main hover:underline flex items-center gap-3 decoration-border-strong underline-offset-8 disabled:opacity-30 disabled:no-underline"
                            >
                              Explore Cinematic Narrative <ArrowRight className="w-4 h-4" />
                            </button>
                         </motion.div>
                         
                         <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} className="gallery-card bg-white border-border-strong p-12">
                            <h4 className="flex items-center gap-4 text-[17px] font-bold mb-8 text-text-main"><Sparkles className="w-5 h-5 text-text-muted" /> Reflection</h4>
                            <blockquote className="text-3xl font-serif-luxe leading-snug text-text-main italic">
                               {results?.quote ? `"${results.quote}"` : "Reflection synthesis in progress..."}
                            </blockquote>
                         </motion.div>
                      </div>

                      <div className="lg:col-span-5">
                         <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} className="gallery-card h-full flex flex-col p-12">
                            <h4 className="text-xl font-bold flex items-center gap-4 mb-12 border-b border-border-subtle pb-8 tracking-tight text-text-main"><Headphones className="w-6 h-6 text-text-muted" /> Curations</h4>
                            
                            <div className="space-y-10 flex-1">
                               {results.video && (
                                 <div className="p-8 rounded-[24px] bg-bg-sidebar border border-border-subtle hover:bg-white transition-all shadow-sm">
                                    <div className="flex items-center gap-4 mb-5">
                                       <Youtube className="text-accent-orange w-6 h-6" />
                                       <h5 className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Visual Catalyst</h5>
                                    </div>
                                    <p className="text-[12px] text-text-secondary mb-8 font-medium leading-relaxed">{results.video?.replace(/https:\/\/\S+/g, '')}</p>
                                    {results.video?.match(/https:\/\/\S+/g) && (
                                      <a href={results.video.match(/https:\/\/\S+/g)[0]} target="_blank" rel="noreferrer" className="btn-nordic w-full py-4 text-[13px] uppercase tracking-widest shadow-md">
                                        Open Archive <ArrowRight className="w-4 h-4" />
                                      </a>
                                    )}
                                 </div>
                               )}

                               <div className="space-y-6">
                                  {results.songs?.map((song, i) => (
                                    <motion.div key={i} whileHover={{ x: 8 }} className="flex items-center gap-5 group">
                                       <div className="w-12 h-12 rounded-xl bg-bg-sidebar flex items-center justify-center text-[11px] font-extrabold text-text-muted group-hover:bg-text-main group-hover:text-white transition-all shadow-sm">
                                          0{i+1}
                                       </div>
                                       <div className="flex-1">
                                          <div className="text-[13px] font-bold text-text-main leading-tight">{song.artist} // {song.title}</div>
                                          <div className="text-[10px] text-text-muted truncate max-w-[200px] italic mt-1">{song.explanation}</div>
                                       </div>
                                       <a href={song.link} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-bg-clay rounded-full">
                                          <ArrowRight className="w-5 h-5 text-text-main" />
                                       </a>
                                    </motion.div>
                                  ))}
                               </div>
                            </div>
                         </motion.div>
                      </div>
                   </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* System Error */}
          {results?.error && (
            <div className="flex justify-center p-20">
              <div className="gallery-card border-border-strong bg-white text-center max-w-lg shadow-xl">
                 <Zap className="w-12 h-12 text-accent-orange mx-auto mb-6" />
                 <h3 className="text-xl font-bold mb-2 text-text-main">Core Failure</h3>
                 <p className="text-text-muted text-sm mb-8 font-medium leading-relaxed">{results.error}</p>
                 <button onClick={() => setResults(null)} className="btn-nordic bg-text-main text-white hover:bg-black w-full">Re-Initialize</button>
              </div>
            </div>
          )}

          {/* Story Modal */}
          <AnimatePresence>
            {showStoryModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-white/60 backdrop-blur-md"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="gallery-card max-w-2xl w-full max-h-[80vh] overflow-y-auto relative bg-white border-border-strong shadow-2xl p-12"
                >
                  <button 
                    onClick={() => setShowStoryModal(false)}
                    className="absolute top-8 right-8 p-2 hover:bg-bg-sidebar rounded-full transition-all"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                  <h4 className="flex items-center gap-3 text-xl font-bold mb-10 text-text-main border-b border-border-subtle pb-6">
                    <BookOpen className="w-6 h-6 text-text-muted" /> Complete Emotional Narrative
                  </h4>
                  <div className="text-xl font-serif-luxe leading-relaxed text-text-secondary italic pr-2">
                    {results.story}
                  </div>
                  <div className="mt-12 pt-8 border-t border-border-subtle flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    <span>Nuance Engine Analysis</span>
                    <span>© 2026 EmotionAI</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Minimalist Footer */}
          <footer className="mt-32 pt-16 pb-16 border-t border-border-subtle flex flex-col items-center gap-6 px-6">
             <div className="flex flex-wrap justify-center gap-10 text-[10px] font-bold tracking-widest text-text-muted uppercase">
                <span>Cortex_Core_v5.0</span>
                <span>Claude_Sync_Protocol</span>
                <span>EmotionAI_Labs</span>
             </div>
             <p className="text-[10px] text-text-muted opacity-60 uppercase tracking-tighter">
               © 2026 EmotionAI // Built for clarity and insight.
             </p>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
