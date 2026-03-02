import { BrainCircuit, Activity, TrendingDown, ArrowRight, Zap } from 'lucide-react';

const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised'];
const EMOTION_EMOJI = {
  happy: '😊', sad: '😢', angry: '😠', fearful: '😨',
  neutral: '😐', surprised: '😲', disgust: '🤢',
};

function Gauge({ value, label, icon: Icon, max = 1 }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-wattle shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-text-secondary font-medium">{label}</span>
          <span className="text-xs text-wattle font-semibold tabular-nums">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-cherry-dark overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-wattle-dark to-wattle transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function analyzeEmotionalJourney(results) {
  const temporal = results.video_temporal || results.audio_temporal || [];
  if (temporal.length < 2) return null;

  // Count transitions and detect journey arc
  const transitions = [];
  for (let i = 1; i < temporal.length; i++) {
    if (temporal[i] !== temporal[i - 1]) {
      transitions.push({ from: temporal[i - 1], to: temporal[i], at: i });
    }
  }

  // Detect dominant emotion in first half vs second half
  const mid = Math.floor(temporal.length / 2);
  const firstHalf = temporal.slice(0, mid);
  const secondHalf = temporal.slice(mid);

  const count = (arr) => {
    const c = {};
    arr.forEach(e => { c[e] = (c[e] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  };

  const firstDom = count(firstHalf)[0];
  const secondDom = count(secondHalf)[0];

  // Detect emotional volatility
  const uniqueEmotions = new Set(temporal).size;
  const volatilityLevel = uniqueEmotions <= 2 ? 'Low' : uniqueEmotions <= 4 ? 'Moderate' : 'High';

  // Build insights
  const insights = [];

  // Journey arc
  if (firstDom && secondDom && firstDom[0] !== secondDom[0]) {
    insights.push({
      icon: ArrowRight,
      label: 'Emotional Journey',
      text: `Started ${firstDom[0]} ${EMOTION_EMOJI[firstDom[0]] || ''} → shifted to ${secondDom[0]} ${EMOTION_EMOJI[secondDom[0]] || ''} over the recording`,
    });
  } else if (firstDom) {
    insights.push({
      icon: Activity,
      label: 'Emotional Consistency',
      text: `Maintained ${firstDom[0]} ${EMOTION_EMOJI[firstDom[0]] || ''} throughout — a stable emotional baseline`,
    });
  }

  // Key transitions
  if (transitions.length > 0) {
    const keyShift = transitions[0];
    insights.push({
      icon: Zap,
      label: `${transitions.length} Transition${transitions.length > 1 ? 's' : ''} Detected`,
      text: `First shift: ${keyShift.from} → ${keyShift.to} at segment ${keyShift.at + 1}. Volatility: ${volatilityLevel} (${uniqueEmotions} unique emotions)`,
    });
  }

  // Emotion distribution summary
  const dist = results.emotion_distribution || {};
  const topTwo = Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 2);
  if (topTwo.length >= 2) {
    const total = Object.values(dist).reduce((s, v) => s + v, 0);
    insights.push({
      icon: BrainCircuit,
      label: 'Emotion Spectrum',
      text: `Dominant: ${topTwo[0][0]} (${Math.round(topTwo[0][1] / total * 100)}%) with ${topTwo[1][0]} (${Math.round(topTwo[1][1] / total * 100)}%) as secondary`,
    });
  }

  return insights;
}

export default function CognitiveInsights({ results }) {
  if (!results) return null;
  const journey = analyzeEmotionalJourney(results);

  return (
    <div className="max-w-2xl mx-auto glass glow-border rounded-2xl p-6 space-y-5 animate-fade-up" style={{ animationDelay: '0.15s' }}>
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
        <BrainCircuit className="w-4 h-4 text-wattle" />
        Cognitive Analysis
      </h3>

      {/* Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Gauge value={results.timeline_confidence ?? 0} label="Confidence" icon={Activity} />
        <Gauge value={results.emotional_stability ?? 0} label="Stability" icon={BrainCircuit} />
        <Gauge value={1 - (results.transition_rate ?? 0)} label="Consistency" icon={TrendingDown} />
      </div>

      {/* Deep insights from temporal data */}
      {journey && journey.length > 0 && (
        <div className="space-y-3 pt-3" style={{ borderTop: '1px solid rgba(213,207,47,0.1)' }}>
          {journey.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <item.icon className="w-3.5 h-3.5 text-wattle mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-wattle font-semibold">{item.label}</span>
                <p className="text-xs text-text-secondary leading-relaxed mt-0.5">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reasoning */}
      {results.reasoning && (
        <p className="text-xs text-text-muted leading-relaxed pt-3 italic" style={{ borderTop: '1px solid rgba(213,207,47,0.06)' }}>
          {results.reasoning}
        </p>
      )}
    </div>
  );
}
