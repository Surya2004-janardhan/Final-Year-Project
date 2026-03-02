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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised'];
const EMOTION_COLORS = {
  neutral:   '#c4a8b0',
  happy:     '#22C55E',
  sad:       '#3B82F6',
  angry:     '#EF4444',
  fearful:   '#A855F7',
  disgust:   '#84CC16',
  surprised: '#F59E0B',
};

/**
 * Build dataset from probability arrays (smooth curves).
 * Each entry in probs is an array of 7 probabilities.
 */
function buildProbDataset(probs) {
  const labels = probs.map((_, i) => `${i + 1}`);
  const datasets = EMOTIONS.map((em, idx) => ({
    label: em.charAt(0).toUpperCase() + em.slice(1),
    data: probs.map((p) => p[idx]),
    borderColor: EMOTION_COLORS[em],
    backgroundColor: EMOTION_COLORS[em] + '15',
    borderWidth: 2,
    pointRadius: 1.5,
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
    backgroundColor: EMOTION_COLORS[em] + '15',
    borderWidth: 2,
    pointRadius: 1.5,
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
        color: '#c4a8b0',
        font: { family: 'Inter', size: 10 },
        boxWidth: 8,
        padding: 10,
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
    title: {
      display: true,
      text: title,
      color: '#f1f5f9',
      font: { family: 'Inter', size: 13, weight: '600' },
      padding: { bottom: 10 },
    },
    tooltip: {
      backgroundColor: 'rgba(94,21,37,0.9)',
      borderColor: 'rgba(213,207,47,0.2)',
      borderWidth: 1,
      titleFont: { family: 'Inter', size: 11 },
      bodyFont: { family: 'Inter', size: 10 },
      callbacks: hasProbs
        ? {
            label: (ctx) => `  ${ctx.dataset.label}: ${(ctx.parsed.y * 100).toFixed(1)}%`,
          }
        : undefined,
    },
  },
  scales: {
    x: {
      ticks: { color: '#8a6670', font: { size: 9 } },
      grid: { color: 'rgba(138,102,112,0.08)' },
      title: { display: true, text: 'Time Segment', color: '#8a6670', font: { size: 9 } },
    },
    y: {
      min: 0,
      max: hasProbs ? 1 : 1.1,
      ticks: {
        color: '#8a6670',
        font: { size: 9 },
        callback: (v) => hasProbs ? `${Math.round(v * 100)}%` : (v === 1 ? '●' : ''),
        stepSize: hasProbs ? 0.25 : undefined,
      },
      grid: { color: 'rgba(138,102,112,0.06)' },
      title: hasProbs ? { display: true, text: 'Probability', color: '#8a6670', font: { size: 9 } } : undefined,
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
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
      {hasAudio && (
        <div className="glass glow-border rounded-2xl p-5">
          <div className="h-72">
            <Line
              data={hasAudioProbs ? buildProbDataset(audioProbs) : buildNameDataset(audioNames)}
              options={chartOptions('Audio Emotion Probabilities', hasAudioProbs)}
            />
          </div>
        </div>
      )}
      {hasVideo && (
        <div className="glass glow-border rounded-2xl p-5">
          <div className="h-72">
            <Line
              data={hasVideoProbs ? buildProbDataset(videoProbs) : buildNameDataset(videoNames)}
              options={chartOptions('Video Emotion Probabilities', hasVideoProbs)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
