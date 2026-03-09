import { useState, useRef, useEffect } from 'react';
import { Sparkles, BookOpen, Quote, Play, Pause, Music, BookMarked, ExternalLink, Youtube } from 'lucide-react';
import axios from 'axios';

/* ── YouTube embed helper ─────────────────────────────── */
function extractYTId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function YouTubeEmbed({ url, title }) {
  const id = extractYTId(url);
  if (!id) return null;
  return (
    <div className="rounded-lg overflow-hidden border border-border-subtle" style={{ aspectRatio: '16/9' }}>
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title={title || 'YouTube video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-0"
      />
    </div>
  );
}

/* ── Deezer song player ───────────────────────────────── */
function SongPlayer({ artist, title, link }) {
  const [track, setTrack] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const audioRef = useRef(null);

  const search = async () => {
    if (searched) { togglePlay(); return; }
    setLoading(true);
    try {
      const q = `${artist} ${title}`.trim();
      const res = await axios.get(`/music/search?q=${encodeURIComponent(q)}`);
      if (res.data.preview) {
        setTrack(res.data);
        setSearched(true);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = res.data.preview;
            audioRef.current.play();
            setPlaying(true);
          }
        }, 100);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const togglePlay = () => {
    if (!audioRef.current || !track) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('ended', onEnd); };
  }, [track]);

  return (
    <div className="flex items-center gap-4 p-2 rounded-lg bg-surface-base border border-border-subtle hover:border-border-strong transition-all group">
      {/* Album art or play button */}
      <button
        onClick={search}
        disabled={loading}
        className="relative w-12 h-12 rounded-md shrink-0 flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:scale-105 active:scale-95"
        style={{
          background: track?.album_art ? `url(${track.album_art}) center/cover` : 'var(--color-surface-raised)',
        }}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center transition-opacity ${track?.album_art ? 'bg-black/40 opacity-0 group-hover:opacity-100' : ''}`}>
            {playing ? <Pause className="w-5 h-5 text-primary fill-primary" /> : <Play className="w-5 h-5 text-primary fill-primary" />}
          </div>
        )}
      </button>

      {/* Track info + progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
           <p className="text-sm text-text-primary font-semibold truncate leading-tight">{title}</p>
           {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors shrink-0">
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <p className="text-xs text-text-secondary truncate mb-2">{artist}</p>
        
        {track ? (
          <div className="h-1 rounded-full bg-surface-raised overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Preview Available</span>
        )}
      </div>

      <audio ref={audioRef} preload="none" />
    </div>
  );
}

/* ── Main component ───────────────────────────────────── */
export default function AIContent({ results }) {
  if (!results) return null;
  const { story, quote, video, books, songs } = results;

  const videoObj = typeof video === 'object' && video !== null
    ? video
    : typeof video === 'string'
      ? { title: video, link: video.match(/https?:\/\/[^\s"]+/)?.[0] || '#' }
      : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
           <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">Cognitive Synthesis</h3>
          <p className="text-[10px] text-text-muted font-medium">AI-Generated Resonance Content</p>
        </div>
      </div>

      {/* Grid Layout for Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Story Section */}
        {story && (
          <div className="lg:col-span-12 xl:col-span-8 panel p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Narrative Resonance</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed first-letter:text-3xl first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-2">
              {story}
            </p>
          </div>
        )}

        {/* Quote Section */}
        {quote && (
          <div className="lg:col-span-6 xl:col-span-4 panel p-6 flex flex-col justify-center bg-primary/5 border-primary/20">
            <Quote className="w-8 h-8 text-primary/20 mb-4" />
            <blockquote className="text-base text-primary font-medium italic leading-snug">
              "{quote}"
            </blockquote>
          </div>
        )}

        {/* Video Recommendation */}
        {videoObj && (
          <div className="lg:col-span-6 xl:col-span-5 panel p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Youtube className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Visual Anchor</span>
            </div>
            
            {extractYTId(videoObj.link) ? (
              <YouTubeEmbed url={videoObj.link} title={videoObj.title} />
            ) : videoObj.link && videoObj.link !== '#' ? (
              <a href={videoObj.link} target="_blank" rel="noopener noreferrer"
                className="block rounded-lg p-6 text-center bg-surface-raised border border-border-subtle transition-all hover:border-primary/40 group group-hover:-translate-y-1"
              >
                <Play className="w-10 h-10 text-primary mx-auto mb-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="text-sm text-text-primary font-bold">Watch Exploration on YouTube</span>
              </a>
            ) : null}

            <div className="space-y-2">
              <p className="text-sm text-text-primary font-bold leading-tight">{videoObj.title}</p>
              {videoObj.reason && <p className="text-xs text-text-secondary leading-relaxed opacity-80">{videoObj.reason}</p>}
            </div>
          </div>
        )}

        {/* Books Section */}
        {books && books.length > 0 && (
          <div className="lg:col-span-6 xl:col-span-7 panel p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <BookMarked className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Expansion literature</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {books.map((book, i) => (
                <div key={i} className="p-3 rounded-lg bg-surface-base border border-border-subtle hover:border-primary/20 transition-colors">
                  <p className="text-xs text-text-primary font-bold truncate mb-1">{book.title}</p>
                  <p className="text-[10px] text-primary font-medium mb-2">{book.author}</p>
                  {book.reason && <p className="text-[10px] text-text-muted leading-tight line-clamp-2">{book.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Songs Section */}
        {songs && songs.length > 0 && (
          <div className="lg:col-span-12 panel p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Music className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Auditory Spectrum</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tighter text-text-muted">Audio API Gateway • Deezer</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {songs.map((song, i) => (
                <SongPlayer key={i} artist={song.artist} title={song.title} link={song.link} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
