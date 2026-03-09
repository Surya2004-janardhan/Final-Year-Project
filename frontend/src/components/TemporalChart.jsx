import { Line } from 'react-chartjs-2';
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
} from 'chart.js';
import { Activity } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised'];
const EMOTION_COLORS = {
  neutral:   '#94A3B8',
  happy:     '#22C55E',
  sad:       '#6499E9',
  angry:     '#F43F5E',
  fearful:   '#A855F7',
  disgust:   '#84CC16',
  surprised: '#FB923C',
};

/**
 * Build dataset from probability arrays (smooth curves).
 */
function buildProbDataset(probs) {
  const labels = probs.map((_, i) => `${i + 1}`);
  const datasets = EMOTIONS.map((em, idx) => ({
    label: em.charAt(0).toUpperCase() + em.slice(1),
    data: probs.map((p) => p[idx]),
    borderColor: EMOTION_COLORS[em],
    backgroundColor: EMOTION_COLORS[em] + '10',
    borderWidth: 2,
    pointRadius: 0,        // cleaner, Uncodixify style
    pointHoverRadius: 5,
    tension: 0.4,          // smooth bezier curves
    fill: false,
  }));
  return { labels, datasets };
}

/**
 * Fallback: build from emotion name arrays (binary spikes).
 */
function buildNameDataset(temporal) {
  const labels = temporal.map((_, i) => `${i + 1}`);
  const datasets = EMOTIONS.map((em) => ({
    label: em.charAt(0).toUpperCase() + em.slice(1),
    data: temporal.map((t) => (t === em ? 1 : 0)),
    borderColor: EMOTION_COLORS[em],
    backgroundColor: EMOTION_COLORS[em] + '10',
    borderWidth: 2,
    pointRadius: 0,
    pointHoverRadius: 5,
    tension: 0.4,
    fill: false,
  }));
  return { labels, datasets };
}

const chartOptions = (title, hasProbs) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#94A3B8',
        font: { family: 'Inter', size: 10, weight: '500' },
        boxWidth: 8,
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 15,
      },
    },
    title: {
      display: false, // handeled by custom header
    },
    tooltip: {
      backgroundColor: '#1C243B',
      borderColor: 'rgba(166, 246, 255, 0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: { family: 'Inter', size: 12, weight: '700' },
      bodyFont: { family: 'Inter', size: 11 },
      titleColor: '#F8FAFC',
      bodyColor: '#F8FAFC',
      callbacks: hasProbs
        ? {
            label: (ctx) => ` ${ctx.dataset.label}: ${(ctx.parsed.y * 100).toFixed(1)}%`,
          }
        : undefined,
    },
  },
  scales: {
    x: {
      ticks: { color: '#64748B', font: { size: 10 } },
      grid: { color: 'rgba(166, 246, 255, 0.03)' },
      title: { 
        display: true, 
        text: 'Temporal Segments (s)', 
        color: '#64748B', 
        font: { size: 10, weight: '600' },
        padding: { top: 10 }
      },
      border: { display: false }
    },
    y: {
      min: 0,
      max: hasProbs ? 1 : 1.1,
      ticks: {
        color: '#64748B',
        font: { size: 10 },
        callback: (v) => hasProbs ? `${Math.round(v * 100)}%` : (v === 1 ? '●' : ''),
        stepSize: hasProbs ? 0.25 : undefined,
      },
      grid: { color: 'rgba(166, 246, 255, 0.03)' },
      title: hasProbs ? { 
        display: true, 
        text: 'Probability Confidence', 
        color: '#64748B', 
        font: { size: 10, weight: '600' } 
      } : undefined,
      border: { display: false }
    },
  },
});

export default function TemporalChart({ results }) {
  if (!results) return null;

  const audioProbs = results.audio_probs_temporal || [];
  const videoProbs = results.video_probs_temporal || [];
  const audioNames = results.audio_temporal || [];
  const videoNames = results.video_temporal || [];

  const hasAudioProbs = audioProbs.length > 0;
  const hasVideoProbs = videoProbs.length > 0;
  const hasAudio = hasAudioProbs || audioNames.length > 0;
  const hasVideo = hasVideoProbs || videoNames.length > 0;

  if (!hasAudio && !hasVideo) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-up">
      <div className="flex items-center gap-3 px-2">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">
           Temporal Distribution
        </h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {hasAudio && (
          <div className="panel p-6 bg-surface-base">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6 text-center">Audio Modality Engine</h4>
            <div className="h-64">
              <Line
                data={hasAudioProbs ? buildProbDataset(audioProbs) : buildNameDataset(audioNames)}
                options={chartOptions('Audio Stream', hasAudioProbs)}
              />
            </div>
          </div>
        )}
        {hasVideo && (
          <div className="panel p-6 bg-surface-base">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6 text-center">Video Modality Engine</h4>
            <div className="h-64">
              <Line
                data={hasVideoProbs ? buildProbDataset(videoProbs) : buildNameDataset(videoNames)}
                options={chartOptions('Video Stream', hasVideoProbs)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
