import { Sparkles, BookOpen, Quote, Play, Music, BookMarked, ExternalLink } from 'lucide-react';

export default function AIContent({ results }) {
  if (!results) return null;
  const { story, quote, video, books, songs } = results;

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

        {/* Watch This — properly rendered */}
        {videoObj && (
          <div className="glass glow-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-wattle">
              <Play className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Watch This</span>
            </div>
            <div className="space-y-2">
              {videoObj.title && (
                <p className="text-sm text-text-primary font-medium">{videoObj.title}</p>
              )}
              {videoObj.channel && (
                <p className="text-xs text-text-muted">by {videoObj.channel}</p>
              )}
              {videoObj.reason && (
                <p className="text-xs text-text-secondary leading-relaxed">{videoObj.reason}</p>
              )}
              {videoObj.link && (
                <a
                  href={videoObj.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-wattle hover:text-wattle-light transition-colors mt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open on YouTube
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Songs playlist */}
      {songs && songs.length > 0 && (
        <div className="glass glow-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-wattle">
            <Music className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Playlist</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {songs.map((song, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xs text-text-muted font-bold mt-0.5 w-4 shrink-0">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm text-text-primary font-medium truncate">
                    {song.title || 'Unknown'}{' '}
                    <span className="text-text-muted font-normal">— {song.artist || 'Unknown'}</span>
                  </p>
                  {song.explanation && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{song.explanation}</p>}
                  {song.link && (
                    <a href={song.link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-wattle/70 hover:text-wattle transition-colors">
                      Listen →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
