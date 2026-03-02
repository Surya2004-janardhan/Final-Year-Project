import { useState } from 'react';
import { Sparkles, BookOpen, Quote, Play, Music, BookMarked, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Extract YouTube video ID from various URL formats:
 * - youtu.be/VIDEO_ID
 * - youtube.com/watch?v=VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 */
function extractYTId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function YouTubeEmbed({ url, title }) {
  const id = extractYTId(url);
  if (!id) return null;
  return (
    <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
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

export default function AIContent({ results }) {
  if (!results) return null;
  const { story, quote, video, books, songs } = results;
  const [playingIdx, setPlayingIdx] = useState(null);

  // Parse video — could be string (old format) or object (new format)
  const videoObj = typeof video === 'object' && video !== null
    ? video
    : typeof video === 'string'
      ? { title: video, link: video.match(/https?:\/\/[^\s"]+/)?.[0] || '#' }
      : null;

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-up" style={{ animationDelay: '0.25s' }}>
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-wattle" />
        AI Recommendations Engine
      </h3>

      {/* Row 1: Story + Books side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Story — takes 3/5 width */}
        {story && (
          <div className="lg:col-span-3 glass glow-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-wattle">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Read Story</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{story}</p>
          </div>
        )}

        {/* Books — takes 2/5 width */}
        {books && books.length > 0 && (
          <div className="lg:col-span-2 glass glow-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-wattle">
              <BookMarked className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Short Reads</span>
            </div>
            <div className="space-y-3">
              {books.map((book, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-lg mt-0.5">📖</span>
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary font-medium">{book.title || 'Unknown'}</p>
                    <p className="text-xs text-text-muted">by {book.author || 'Unknown'}</p>
                    {book.reason && <p className="text-xs text-text-secondary mt-0.5">{book.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Quote + Video side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quote */}
        {quote && (
          <div className="glass glow-border rounded-2xl p-5 flex flex-col justify-center space-y-2">
            <Quote className="w-5 h-5 text-wattle/30" />
            <blockquote className="text-sm text-text-primary italic leading-relaxed pl-3" style={{ borderLeft: '2px solid rgba(213,207,47,0.25)' }}>
              {quote}
            </blockquote>
          </div>
        )}

        {/* Watch This — with embedded player */}
        {videoObj && (
          <div className="glass glow-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-wattle">
              <Play className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Watch This</span>
            </div>
            {/* Embedded YouTube player */}
            {extractYTId(videoObj.link) && (
              <YouTubeEmbed url={videoObj.link} title={videoObj.title} />
            )}
            <div className="space-y-1">
              {videoObj.title && <p className="text-sm text-text-primary font-medium">{videoObj.title}</p>}
              {videoObj.channel && <p className="text-[11px] text-text-muted">by {videoObj.channel}</p>}
              {videoObj.reason && <p className="text-xs text-text-secondary leading-relaxed">{videoObj.reason}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Songs playlist with inline players */}
      {songs && songs.length > 0 && (
        <div className="glass glow-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-wattle">
            <Music className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Playlist</span>
          </div>
          <div className="space-y-3">
            {songs.map((song, i) => {
              const hasEmbed = !!extractYTId(song.link);
              const isPlaying = playingIdx === i;
              return (
                <div key={i}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-muted font-bold w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">
                        {song.title || 'Unknown'}{' '}
                        <span className="text-text-muted font-normal">— {song.artist || 'Unknown'}</span>
                      </p>
                      {song.explanation && <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{song.explanation}</p>}
                    </div>
                    {hasEmbed ? (
                      <button
                        onClick={() => setPlayingIdx(isPlaying ? null : i)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer shrink-0"
                        style={{
                          background: isPlaying ? 'rgba(213,207,47,0.15)' : 'rgba(213,207,47,0.08)',
                          color: '#D5CF2F',
                          border: '1px solid rgba(213,207,47,0.15)',
                        }}
                      >
                        {isPlaying ? <ChevronUp className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        {isPlaying ? 'Close' : 'Play'}
                      </button>
                    ) : song.link ? (
                      <a href={song.link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-wattle/70 hover:text-wattle transition-colors shrink-0">
                        Listen →
                      </a>
                    ) : null}
                  </div>
                  {/* Inline YouTube player */}
                  {isPlaying && hasEmbed && (
                    <div className="mt-2 ml-7">
                      <YouTubeEmbed url={song.link} title={song.title} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
