from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
import librosa
from tensorflow import keras
import requests
import ffmpeg
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' # Silence TF warnings
import json

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB limit for uploads
# Emotion labels (must match training order)
EMOTIONS_7 = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised']

# Load models once at startup
print("Loading models...")
try:
    audio_model = keras.models.load_model('models/audio_emotion_model.h5')
    video_model = keras.models.load_model('models/video_emotion_model.h5')
    
    # Feature extractor for video
    base_cnn = keras.applications.MobileNetV2(weights='imagenet', include_top=False, input_shape=(112, 112, 3))
    base_cnn.trainable = False
    feature_extractor = keras.Sequential([
        base_cnn,
        keras.layers.GlobalAveragePooling2D()
    ])
    
    print("Models and feature extractor loaded successfully")
except Exception as e:
    print(f"Error loading models: {e}")
    audio_model = None
    video_model = None
    feature_extractor = None

# Initialize Groq client
# below trying to set env of groq
# GROQ_API_KEY 
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# print("Groq client initialized", os.getenv("GROQ_API_KEY"))
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Audio processing parameters
SR = 16000
WINDOW_SIZE = 0.025
HOP_SIZE = 0.01
N_MFCC = 13
HOP_LENGTH = 512
N_FRAMES = 300  # Number of time frames for MFCC features

# Video processing parameters
VIDEO_WINDOW_SIZE = 1  # seconds
TARGET_SIZE = (112, 112)
NUM_FRAMES = 10

def extract_mfcc(audio_path):
    """Extract MFCC features from audio file using optimized batch processing."""
    try:
        # Load audio using librosa
        y, sr = librosa.load(audio_path, sr=SR, mono=True)
        if len(y) == 0:
            raise ValueError("Empty audio")

        # Compute MFCC for the entire audio clip at once (Massive speedup)
        # We target the same window/hop structure as before but computed globally
        # N_MFCC=13, HOP_LENGTH=512
        full_mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC, hop_length=HOP_LENGTH)
        full_mfcc = full_mfcc.T # (Time, N_MFCC)

        # Calculate how many MFCC frames correspond to our window/hop in seconds
        # window_samples / hop_length = frames_per_window
        window_frames = int((WINDOW_SIZE * sr) / HOP_LENGTH)
        hop_frames = int((HOP_SIZE * sr) / HOP_LENGTH)
        
        # Ensure window_frames is at least 1
        window_frames = max(1, window_frames)
        hop_frames = max(1, hop_frames)

        mfcc_windows = []
        # Slice the pre-computed MFCC into windows
        for start in range(0, full_mfcc.shape[0] - window_frames + 1, hop_frames):
            end = start + window_frames
            mfcc_slice = full_mfcc[start:end]

            # Pad or truncate to N_FRAMES
            if mfcc_slice.shape[0] < N_FRAMES:
                mfcc_slice = np.pad(mfcc_slice, ((0, N_FRAMES - mfcc_slice.shape[0]), (0, 0)), mode='constant')
            else:
                mfcc_slice = mfcc_slice[:N_FRAMES]

            mfcc_windows.append(mfcc_slice[..., np.newaxis])

        # Fallback if no windows were created
        if len(mfcc_windows) == 0:
            mfcc_slice = full_mfcc
            if mfcc_slice.shape[0] < N_FRAMES:
                mfcc_slice = np.pad(mfcc_slice, ((0, N_FRAMES - mfcc_slice.shape[0]), (0, 0)), mode='constant')
            else:
                mfcc_slice = mfcc_slice[:N_FRAMES]
            mfcc_windows.append(mfcc_slice[..., np.newaxis])

        return np.array(mfcc_windows)
    except Exception as e:
        print(f"Failed to extract MFCC: {e}")
        return None

def cognitive_reasoning(audio_emotion, video_emotion, fused_emotion, audio_preds, video_preds):
    """Enhanced cognitive reasoning with more detailed analysis."""
    reasoning = []

    # Basic agreement analysis
    if audio_emotion == video_emotion:
        reasoning.append(f"Both audio and video modalities strongly agree on {audio_emotion}.")
    else:
        reasoning.append(f"Modalities show disagreement: audio suggests {audio_emotion} while video indicates {video_emotion}. Fusion resulted in {fused_emotion} as the most balanced interpretation.")

    # Confidence analysis with scores
    audio_conf = np.max(np.mean(audio_preds, axis=0))
    video_conf = np.max(np.mean(video_preds, axis=0))
    reasoning.append(f"Confidence levels: Audio {audio_conf:.2f}, Video {video_conf:.2f}. Higher confidence indicates more reliable detection.")

    # Temporal consistency analysis
    audio_consistency = len(set([EMOTIONS_7[np.argmax(p)] for p in audio_preds])) / len(audio_preds)
    video_consistency = len(set([EMOTIONS_7[np.argmax(p)] for p in video_preds])) / len(video_preds)
    reasoning.append(f"Temporal stability: Audio consistency {audio_consistency:.2f}, Video consistency {video_consistency:.2f}. Lower values indicate more emotional fluctuation.")

    # Emotion intensity analysis
    audio_intensity = np.mean([np.max(p) for p in audio_preds])
    video_intensity = np.mean([np.max(p) for p in video_preds])
    reasoning.append(f"Emotional intensity: Audio {audio_intensity:.2f}, Video {video_intensity:.2f}. Higher values suggest stronger emotional expression.")

    # Contextual interpretation
    if fused_emotion in ['angry', 'fearful', 'sad']:
        reasoning.append("Detected negative emotion cluster. This may indicate stress, concern, or dissatisfaction. Consider environmental factors and personal context.")
    elif fused_emotion in ['happy', 'surprised']:
        reasoning.append("Positive emotional state detected. This suggests engagement, satisfaction, or pleasant surprise. The person appears to be in a favorable emotional state.")
    elif fused_emotion == 'neutral':
        reasoning.append("Neutral emotional state observed. This could indicate calmness, concentration, or emotional restraint. May also suggest controlled or professional demeanor.")
    elif fused_emotion == 'disgust':
        reasoning.append("Disgust detected. This emotion often relates to aversion or strong disapproval. Consider recent experiences or environmental factors.")

    # Dynamic Mapping: Stability & Intensity analysis
    stability_score = results.get('emotional_stability', 0.5)
    intensity_peak = results.get('transition_rate', 0.0)
    
    audio_prob = np.max(np.mean(audio_preds, axis=0))
    video_prob = np.max(np.mean(video_preds, axis=0))

    if audio_prob and video_prob:
        pref = "Multimodal analysis shows high emotional cohesion."
    else:
        pref = "Analysis suggests a modal divergence, indicating complex internal regulation."

    # Temporal pattern analysis for Dynamic Mapping
    audio_changes = sum(1 for i in range(1, len(audio_preds)) if np.argmax(audio_preds[i]) != np.argmax(audio_preds[i-1]))
    video_changes = sum(1 for i in range(1, len(video_preds)) if np.argmax(video_preds[i]) != np.argmax(video_preds[i-1]))
    total_shifts = audio_changes + video_changes
    
    mapping_depth = []
    mapping_depth.append(pref)
    
    if total_shifts > 5:
        mapping_depth.append(f"Dynamic Mapping detects a high-frequency temporal shift ({total_shifts} transitions), suggesting a sudden change in emotional state.")
    else:
        mapping_depth.append(f"Temporal behavior indicates high synchronicity and steady state transitions.")
        
    if stability_score > 0.8: mapping_depth.append("High emotional cohesion observed.")
    else: mapping_depth.append("Dynamic flux detected in the emotional arc.")

    return " ".join(mapping_depth)

def generate_llm_content(fused_emotion, reasoning, audio_temporal, video_temporal):
    """Generate personalized story, quote, video, books, and songs using Groq LLM."""
    prompt = f"""
Based on the Dynamic Mapping and Multimodal analysis results:

Primary Emotion Detected: {fused_emotion}
Cognitive Analysis (Temporal Behavior): {reasoning}
Audio Emotional Timeline: {', '.join(audio_temporal)}
Video Emotional Timeline: {', '.join(video_temporal)}

Please generate highly personalized content focused on the DYNAMIC MAPPING of these shifts:

1. A personalized story (STRICTLY 100-110 words) that describes the 'Sudden Shifts' or 'Temporal Consistency' seen in the analysis. Focus on the arc of the emotion rather than just the final state.

2. An inspirational quote tailored to this specific dynamic behavior.

3. A YouTube video recommendation (object with title, channel, link, and reason). Link format: https://www.youtube.com/results?search_query=SEARCH+TERMS

4. 2-3 book recommendations as an array of objects with keys: title, author, reason, and purchase_link (Provide a Google Books or Amazon search URL for the book).

5. 2-3 song recommendations (artist, title, explanation). Note: No links needed for songs, as they are cached locally.

Format as valid JSON. Ensure the story is EXACTLY between 100 and 110 words.
"""
    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.8,
            "max_tokens": 1000
        }
        response = requests.post(GROQ_URL, headers=headers, json=data)
        if response.status_code == 200:
            try:
                raw_json = response.json()
                content = raw_json['choices'][0]['message']['content']
                # Clean up JSON response
                content = content.strip()
                if content.startswith('```json'):
                    content = content[7:]
                if content.endswith('```'):
                    content = content[:-3]
                content = content.strip()
                try:
                    return json.loads(content)
                except Exception as json_err:
                    print(f"LLM JSON parse error: {json_err}\nRaw content: {content}")
                    return generate_fallback_content(fused_emotion)
            except Exception as api_json_err:
                print(f"LLM API response JSON error: {api_json_err}\nRaw response: {response.text}")
                return generate_fallback_content(fused_emotion)
        else:
            print(f"Groq API error: {response.status_code} - {response.text}")
            return generate_fallback_content(fused_emotion)
    except Exception as e:
        print(f"LLM error: {e}")
        return generate_fallback_content(fused_emotion)

def generate_fallback_content(fused_emotion):
    """Generate sophisticated fallback content when LLM fails."""
    fallbacks = {
        'happy': {
            'story': 'A luminous joy radiated through the atmosphere as the soul expressed pure exuberance. The temporal patterns reveal a steady ascent into a state of genuine contentment and radiant positivity.',
            'quote': '"To be happy is to be able to become aware of oneself without fright." — Walter Benjamin',
            'video': {'title': 'The Science of Happiness', 'channel': 'SoulPancake', 'link': 'https://youtu.be/GXy__kBVq1M', 'reason': 'A deep dive into the neurological foundations of joy.'},
            'books': [{'title': 'The Happiness Project', 'author': 'Gretchen Rubin', 'reason': 'Practical strategies for cultivating daily joy.'}, {'title': 'Flow', 'author': 'Mihaly Csikszentmihalyi', 'reason': 'Understanding the psychology of optimal experience.'}],
            'songs': [{'artist': 'Pharrell Williams', 'title': 'Happy', 'link': 'https://youtu.be/ZbZSe6N_BXs', 'explanation': 'An anthem of pure, unadulterated joy.'}, {'artist': 'Coldplay', 'title': 'A Sky Full of Stars', 'link': 'https://youtu.be/VPRjCeoBqrI', 'explanation': 'A vibrant sonic landscape matching elevated emotional states.'}]
        },
        'sad': {
            'story': 'A quiet melancholy permeated the recording, characterized by introspective pauses and a tender vulnerability. The emotional arc suggests a profound depth of feeling and reflective sorrow.',
            'quote': '"There is no greater sorrow than to recall in misery the time when we were happy." — Dante Alighieri',
            'video': {'title': 'Why We Feel Sad', 'channel': 'The School of Life', 'link': 'https://youtu.be/8UhBaVeFyLs', 'reason': 'Exploring the beauty and necessity of our darker moods.'},
            'books': [{'title': 'When Things Fall Apart', 'author': 'Pema Chödrön', 'reason': 'Finding peace in impermanence and difficulty.'}, {'title': 'Man\'s Search for Meaning', 'author': 'Viktor Frankl', 'reason': 'Discovering purpose through suffering.'}],
            'songs': [{'artist': 'Adele', 'title': 'Someone Like You', 'link': 'https://youtu.be/hLQl3WQQoQ0', 'explanation': 'A masterful expression of longing and emotional processing.'}, {'artist': 'Bon Iver', 'title': 'Holocene', 'link': 'https://youtu.be/TWcyIpul8OE', 'explanation': 'Reflective and atmospheric for moments of deep contemplation.'}]
        },
        'angry': {
            'story': 'A surge of intense energy was detected, manifesting in sharp vocal modulations and forceful expressions. This visceral reaction reflects a powerful stand against perceived injustice or frustration.',
            'quote': '"For every minute you are angry you lose sixty seconds of happiness." — Ralph Waldo Emerson',
            'video': {'title': 'The Power of Vulnerability', 'channel': 'TED', 'link': 'https://youtu.be/iCvmsMzlF7o', 'reason': 'Brené Brown on channeling intense emotions constructively.'},
            'books': [{'title': 'Anger', 'author': 'Thich Nhat Hanh', 'reason': 'Mindful approaches to transforming anger.'}, {'title': 'The Dance of Anger', 'author': 'Harriet Lerner', 'reason': 'Positive patterns for expressing anger constructively.'}],
            'songs': [{'artist': 'Linkin Park', 'title': 'In the End', 'link': 'https://youtu.be/eVTXPUF4Oz4', 'explanation': 'A rhythmic outlet for complex frustrations.'}, {'artist': 'Rage Against the Machine', 'title': 'Killing in the Name', 'link': 'https://youtu.be/bWXazVhlyxQ', 'explanation': 'Raw energy to match internal intensity.'}]
        },
        'fearful': {
            'story': 'A sense of cautious trepidation was observed, with signals suggesting high vigilance and internal tension. The timeline indicates a journey through uncertainty toward a search for security.',
            'quote': '"The only thing we have to fear is fear itself." — Franklin D. Roosevelt',
            'video': {'title': '10 Minute Guided Meditation', 'channel': 'Headspace', 'link': 'https://youtu.be/inpok4MKVLM', 'reason': 'A calming meditation for grounding in moments of fear.'},
            'books': [{'title': 'Feel the Fear and Do It Anyway', 'author': 'Susan Jeffers', 'reason': 'Practical guide to moving through fear.'}, {'title': 'The Gift of Fear', 'author': 'Gavin de Becker', 'reason': 'Understanding how fear protects us.'}],
            'songs': [{'artist': 'Taylor Swift', 'title': 'Fearless', 'link': 'https://youtu.be/ptSjNWnzpjg', 'explanation': 'A reminder of courage within every heartbeat.'}, {'artist': 'Florence + The Machine', 'title': 'Shake It Out', 'link': 'https://youtu.be/WbN0nX61rIs', 'explanation': 'A rhythmic exorcism of lingering anxieties.'}]
        },
        'neutral': {
            'story': 'A state of exquisite equilibrium and stoic poise was maintained throughout the session. The stability of the signals reflects a centered consciousness and professional restraint.',
            'quote': '"Nothing diminishes anxiety faster than action." — Walter Richard Sickert',
            'video': {'title': 'How to Be Calm', 'channel': 'The School of Life', 'link': 'https://youtu.be/vLst6_NWOTE', 'reason': 'The benefits of emotional neutrality and inner calm.'},
            'books': [{'title': 'The Power of Now', 'author': 'Eckhart Tolle', 'reason': 'Embracing present-moment awareness.'}, {'title': 'Stillness Is the Key', 'author': 'Ryan Holiday', 'reason': 'Finding calm in a chaotic world.'}],
            'songs': [{'artist': 'Ludovico Einaudi', 'title': 'Nuvole Bianche', 'link': 'https://youtu.be/kcihcYEOeic', 'explanation': 'Pianistic perfection for centered focus.'}, {'artist': 'Marconi Union', 'title': 'Weightless', 'link': 'https://youtu.be/UfcAVejslrU', 'explanation': 'Scientifically designed to reduce anxiety.'}]
        },
        'surprised': {
            'story': 'A sudden rupture in the expected emotional flow led to a state of dynamic astonishment. The high-intensity peaks indicate a genuine reaction to the unexpected and the marvelous.',
            'quote': '"The world is full of magic things, patiently waiting for our senses to grow sharper." — W.B. Yeats',
            'video': {'title': 'The Surprising Science of Happiness', 'channel': 'TED', 'link': 'https://youtu.be/4q1dgn_C0AU', 'reason': 'Dan Gilbert on how surprise shapes our happiness.'},
            'books': [{'title': 'Stumbling on Happiness', 'author': 'Daniel Gilbert', 'reason': 'How our minds trick us about what makes us happy.'}, {'title': 'The Unexpected', 'author': 'Maria Konnikova', 'reason': 'The science of surprises and wonder.'}],
            'songs': [{'artist': 'Post Malone', 'title': 'Wow.', 'link': 'https://youtu.be/393C3pr2ioY', 'explanation': 'A celebration of the unexpected.'}, {'artist': 'ELO', 'title': 'Mr. Blue Sky', 'link': 'https://youtu.be/aQUlA8Hcv4s', 'explanation': 'A burst of sonic light and wonder.'}]
        },
        'disgust': {
            'story': 'A visceral sense of aversion was detected, manifesting as a sharp withdrawal from the stimulus. The analysis suggests a strong internal boundary being established.',
            'quote': '"Disgust is the visceral realization that we have a standard." — Anonymous',
            'video': {'title': 'How Emotions Work', 'channel': 'Kurzgesagt', 'link': 'https://youtu.be/SJOjpprbfMo', 'reason': 'Understanding the evolutionary roots of all emotions.'},
            'books': [{'title': 'Radical Acceptance', 'author': 'Tara Brach', 'reason': 'Embracing life with compassion.'}, {'title': 'The Upside of Your Dark Side', 'author': 'Todd Kashdan', 'reason': 'Finding value in uncomfortable emotions.'}],
            'songs': [{'artist': 'Britney Spears', 'title': 'Toxic', 'link': 'https://youtu.be/LOZuxwVk7TU', 'explanation': 'Recognizing what we find disagreeable.'}, {'artist': 'Lorde', 'title': 'Royals', 'link': 'https://youtu.be/nlcIKh6sBtc', 'explanation': 'Subtle disdain for the superficial.'}]
        }
    }

    return fallbacks.get(fused_emotion, fallbacks['neutral'])

def sample_frames(video_path):
    """Sample frame sequences from video over time with fallback for missing metadata."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"ERROR: Could not open video file {video_path}")
        return None

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Fallback for WebM/missing metadata
    if total_frames <= 0 or fps <= 0:
        print("WEB_METADATA_MISSING: Counting frames manually...")
        count = 0
        while True:
            ret, _ = cap.read()
            if not ret: break
            count += 1
        total_frames = count
        fps = 30 # Assumption if missing
        cap.release()
        cap = cv2.VideoCapture(video_path) # Re-open for sampling
    
    duration = total_frames / fps if fps > 0 else 0
    print(f"Video Stats: {total_frames} frames, {fps} FPS, {duration:.2f}s duration")

    if total_frames == 0:
        cap.release()
        return None

    # Sample sequences every VIDEO_WINDOW_SIZE seconds
    sequences = []
    window_frames = max(1, int(VIDEO_WINDOW_SIZE * fps))
    hop_frames = max(1, int(VIDEO_WINDOW_SIZE * fps / 2))
    
    for start_frame in range(0, total_frames - window_frames + 1, hop_frames):
        end_frame = start_frame + window_frames
        frames = []
        
        # Select NUM_FRAMES from this window
        step = max(1, window_frames // NUM_FRAMES)
        for frame_idx in range(start_frame, end_frame, step):
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if ret:
                frame = cv2.resize(frame, TARGET_SIZE) / 255.0
                frames.append(frame)
            if len(frames) == NUM_FRAMES:
                break
        
        if len(frames) == NUM_FRAMES:
            sequences.append(np.array(frames))
    
    cap.release()
    return np.array(sequences) if sequences else None

# Global progress state
progress_state = {"progress": 0, "status": "Ready", "results": None}

@app.route('/status', methods=['GET'])
def get_status():
    return jsonify(progress_state)

@app.route('/process', methods=['POST'])
def process():
    global progress_state
    progress_state = {"progress": 0, "status": "Initializing", "results": None}
    
    print("=" * 50)
    print("STARTING EMOTION ANALYSIS PROCESS")
    print("=" * 50)

    if video_model is None or feature_extractor is None:
        print("ERROR: Models not loaded")
        return jsonify({'error': 'Models not loaded'})

    try:
        # Save uploaded video file
        video_file = request.files['video']
        raw_video_path = 'temp_raw_video.webm'
        video_path = 'temp_video.mp4'
        audio_path = 'temp_audio.wav'
        
        print(f"Saving raw video to {raw_video_path}")
        video_file.save(raw_video_path)

        # 1. Normalize Video using FFmpeg (Fixes WebM headers for OpenCV)
        progress_state["status"] = "Normalizing Video"
        progress_state["progress"] = 5
        print("Normalizing video container...")
        ffmpeg_bin = os.path.join(os.getcwd(), 'ffmpeg.exe') if os.path.exists('ffmpeg.exe') else 'ffmpeg'
        try:
            (
                ffmpeg
                .input(raw_video_path)
                .output(video_path, vcodec='libx264', acodec='aac', strict='experimental')
                .overwrite_output()
                .run(cmd=ffmpeg_bin, quiet=True)
            )
            print("Video normalized successfully")
        except Exception as e:
            print(f"Video normalization failed: {e}. Falling back to raw file.")
            video_path = raw_video_path

        # 2. Extract audio from video
        progress_state["status"] = "Extracting Audio"
        progress_state["progress"] = 10
        print("Extracting audio from video...")
        try:
            (
                ffmpeg
                .input(video_path)
                .output(audio_path, acodec='pcm_s16le', ac=1, ar='16000')
                .overwrite_output()
                .run(cmd=ffmpeg_bin, quiet=True)
            )
            print("Audio extracted successfully")
        except Exception as e:
            print(f"Audio extraction failed: {e}")
            audio_path = None

        # --- UNIFIED TEMPORAL PROCESSING ---
        progress_state["status"] = "Initializing Multimodal Streams"
        progress_state["progress"] = 12
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0
        
        # Audio Modality Engine Setup
        y_audio, sr_audio = (None, None)
        if audio_path and os.path.exists(audio_path):
            print("Audio Modality Engine: Loading stream...")
            progress_state["status"] = "Loading Audio Stream"
            try:
                y_audio, sr_audio = librosa.load(audio_path, sr=SR, mono=True)
                print(f"Audio loaded: {len(y_audio)/SR:.2f}s at {SR}Hz")
            except Exception as e:
                print(f"Audio Load Error: {e}")

        # Create overlapping 1s windows (every 0.5s)
        time_points = np.arange(0, max(0.1, duration - 1.0), 0.5)
        video_batch = []
        audio_batch = []
        
        total_segments = len(time_points)
        print(f"Synthesizing {total_segments} temporal segments...")
        
        for i, t in enumerate(time_points):
            # 1. Video Segment Extraction
            progress_state["status"] = f"Video Segmentation: {i+1}/{total_segments}"
            # Scale 15% -> 35%
            progress_state["progress"] = 15 + int((i / total_segments) * 20)
            
            start_f = int(t * fps)
            end_f = int((t + 1) * fps)
            seq = []
            step = max(1, (end_f - start_f) // NUM_FRAMES)
            for f_idx in range(start_f, min(total_frames, end_f), step):
                cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
                ret, frame = cap.read()
                if ret:
                    seq.append(cv2.resize(frame, TARGET_SIZE) / 255.0)
                if len(seq) == NUM_FRAMES: break
            
            # Pad video seq if needed
            while len(seq) < NUM_FRAMES:
                seq.append(np.zeros((*TARGET_SIZE, 3)))
            video_batch.append(np.array(seq))
            
            # 2. Audio Segment Extraction (MFCC)
            if y_audio is not None:
                progress_state["status"] = f"Audio Modality: MFCC Segment {i+1}/{total_segments}"
                # Scale 35% -> 45%
                progress_state["progress"] = 35 + int((i / total_segments) * 10)
                
                as_start = int(t * SR)
                as_end = int((t + 1) * SR)
                y_segment = y_audio[as_start:as_end]
                
                # Extract MFCC for this 1s chunk
                m_feat = librosa.feature.mfcc(y=y_segment, sr=SR, n_mfcc=N_MFCC, hop_length=HOP_LENGTH).T
                # Pad/Truncate to N_FRAMES
                if m_feat.shape[0] < N_FRAMES:
                    m_feat = np.pad(m_feat, ((0, N_FRAMES - m_feat.shape[0]), (0, 0)), mode='constant')
                else:
                    m_feat = m_feat[:N_FRAMES]
                audio_batch.append(m_feat[..., np.newaxis])
            
            if i % 5 == 0 or i == total_segments - 1:
                print(f"  > Processing segment {i+1}/{total_segments} at {t:.1f}s (Audio+Video)")

        cap.release()

        # BATCH INFERENCE
        video_preds = []
        audio_preds = []
        
        if video_batch:
            progress_state["status"] = "Neural Video Inference: Running Batch"
            progress_state["progress"] = 50
            print("Neural Engine: Running video batch inference...")
            v_batch = np.array(video_batch) # (N, 10, 112, 112, 3)
            # Flatten to extract features
            v_flat = v_batch.reshape(-1, 112, 112, 3)
            v_features = feature_extractor.predict(v_flat, batch_size=32, verbose=0)
            # Reshape back and pool
            v_seq_feat = v_features.reshape(len(time_points), NUM_FRAMES, -1)
            v_input = np.mean(v_seq_feat, axis=1)
            video_preds = video_model.predict(v_input, verbose=0)
            print(f"Neural Engine: Video predictions generated for {len(video_preds)} segments")
            
        if audio_batch:
            progress_state["status"] = "Neural Audio Inference: Running Batch"
            progress_state["progress"] = 70
            print("Neural Engine: Running audio batch inference...")
            a_input = np.array(audio_batch) # (N, 300, 13, 1)
            audio_preds = audio_model.predict(a_input, batch_size=32, verbose=0)
            print(f"Neural Engine: Audio predictions generated for {len(audio_preds)} segments")

        progress_state["progress"] = 85
        progress_state["status"] = "Cognitive Synthesis Layer"
        print("Cognitive Layer: Analyzing multimodal temporal patterns...")

        audio_emotions_temporal = [EMOTIONS_7[np.argmax(p)] for p in audio_preds] if len(audio_preds) > 0 else []
        video_emotions_temporal = [EMOTIONS_7[np.argmax(p)] for p in video_preds] if len(video_preds) > 0 else []

        # TIMELINE-BASED EMOTION DETERMINATION
        from collections import Counter
        combined_emotions = []
        if audio_emotions_temporal and video_emotions_temporal:
            # Equal length guaranteed by time_points
            combined_emotions = video_emotions_temporal 
        elif video_emotions_temporal:
            combined_emotions = video_emotions_temporal
        elif audio_emotions_temporal:
            combined_emotions = audio_emotions_temporal
        else:
            combined_emotions = ["neutral"]

        emotion_counts = Counter(combined_emotions)
        total_predictions = len(combined_emotions)
        timeline_dominant_emotion = emotion_counts.most_common(1)[0][0]
        timeline_confidence = emotion_counts.most_common(1)[0][1] / total_predictions
        unique_emotions = len(emotion_counts)
        emotional_stability = 1.0 - (unique_emotions - 1) / len(EMOTIONS_7)
        transitions = sum(1 for i in range(1, len(combined_emotions)) if combined_emotions[i] != combined_emotions[i-1])
        transition_rate = transitions / max(1, len(combined_emotions) - 1)

        # COGNITIVE LAYER ANALYSIS
        reasoning_parts = []
        if timeline_confidence > 0.7:
            reasoning_parts.append(f"Strong emotional consistency: {timeline_dominant_emotion} in {timeline_confidence*100:.1f}%")
        else:
            reasoning_parts.append(f"Mixed state: {timeline_dominant_emotion} leads at {timeline_confidence*100:.1f}%")
        
        if emotional_stability > 0.8: reasoning_parts.append("High stability.")
        elif emotional_stability > 0.6: reasoning_parts.append("Moderate stability.")
        else: reasoning_parts.append("Low stability.")

        cognitive_reasoning = " ".join(reasoning_parts)
        progress_state["progress"] = 90
        progress_state["status"] = "Generating AI Response"

        # AI LAYER
        llm_content = generate_llm_content(
            timeline_dominant_emotion,
            cognitive_reasoning,
            audio_emotions_temporal,
            video_emotions_temporal
        )

        # Build probability arrays for smooth temporal charts
        audio_probs = audio_preds.tolist() if len(audio_preds) > 0 else []
        video_probs = video_preds.tolist() if len(video_preds) > 0 else []

        final_result = {
            'audio_emotion': Counter(audio_emotions_temporal).most_common(1)[0][0] if audio_emotions_temporal else None,
            'video_emotion': timeline_dominant_emotion,
            'fused_emotion': timeline_dominant_emotion,
            'reasoning': cognitive_reasoning,
            'story': llm_content.get('story', ''),
            'quote': llm_content.get('quote', ''),
            'video': llm_content.get('video', ''),
            'books': llm_content.get('books', []),
            'songs': llm_content.get('songs', []),
            'audio_temporal': audio_emotions_temporal,
            'video_temporal': video_emotions_temporal,
            'audio_probs_temporal': audio_probs,
            'video_probs_temporal': video_probs,
            'time_points': list(range(len(combined_emotions))),
            'timeline_confidence': float(timeline_confidence),
            'emotional_stability': float(emotional_stability),
            'transition_rate': float(transition_rate),
            'emotion_distribution': dict(emotion_counts)
        }

        # Clean up
        for path in [raw_video_path, video_path, audio_path]:
            if path and os.path.exists(path): os.remove(path)

        progress_state["progress"] = 100
        progress_state["status"] = "Complete"
        progress_state["results"] = final_result
        return jsonify(final_result)

    except Exception as e:
        progress_state["status"] = f"Error: {str(e)}"
        return jsonify({'error': str(e)})

@app.route('/downloaded_music/<path:filename>')
def serve_music(filename):
    """Serve cached music files from the music/ directory."""
    return send_from_directory('music', filename)

@app.route('/music/search', methods=['GET'])
def music_search():
    """Search music for a song, cache it locally, and return local stream URL."""
    try:
        q = request.args.get('q', '')
        if not q:
            return jsonify({'error': 'No query'}), 400
            
        print(f"Music Engine: Searching for {q}...")
        # Step 1: Search for the song
        search_url = f"https://musicapi.x007.workers.dev/search?q={requests.utils.quote(q)}&searchEngine=gaana"
        search_resp = requests.get(search_url, timeout=10)
        
        if search_resp.status_code == 200:
            search_data = search_resp.json()
            results = search_data.get('response', [])
            if not results:
                return jsonify({'error': 'Not found'}), 404
            
            top_song = results[0]
            song_id = top_song.get('id')
            # Sanitize filename: replace non-alphanumeric with underscores
            safe_title = "".join([c if c.isalnum() else "_" for c in top_song.get('title', 'song')])
            filename = f"{song_id}_{safe_title}.mp3"
            filepath = os.path.join('music', filename)
            
            # Step 2: Check cache or download
            if not os.path.exists(filepath):
                print(f"Music Engine: Caching new song -> {filename}")
                fetch_url = f"https://musicapi.x007.workers.dev/fetch?id={song_id}"
                fetch_resp = requests.get(fetch_url, timeout=15)
                
                if fetch_resp.status_code == 200:
                    stream_url = fetch_resp.json().get('response')
                    if stream_url:
                        # Download the actual file
                        audio_data = requests.get(stream_url, timeout=20).content
                        with open(filepath, 'wb') as f:
                            f.write(audio_data)
                        print(f"Music Engine: Cache successful.")
                    else:
                        return jsonify({'error': 'Stream URL not found'}), 404
                else:
                    return jsonify({'error': 'Fetch API error'}), 500
            else:
                print(f"Music Engine: Using cached file -> {filename}")

            # Return local URL
            return jsonify({
                'title': top_song.get('title', 'Unknown Title'),
                'artist': top_song.get('more_info', {}).get('artistMap', {}).get('primary_artists', [{}])[0].get('name', 'Various Artists'),
                'preview': f"/downloaded_music/{filename}", 
                'album_art': top_song.get('image', ''),
                'duration': int(top_song.get('more_info', {}).get('duration', 0)),
            })
                
        return jsonify({'error': 'Music API error'}), 500
    except Exception as e:
        print(f"Music Engine Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Chatbot endpoint — answers questions about analysis results."""
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        results_context = data.get('context', {})
        history = data.get('history', [])[-10:]  # keep last 10 messages

        # Build context summary from results
        ctx_parts = []
        if results_context:
            ctx_parts.append(f"Primary Emotion: {results_context.get('fused_emotion', 'N/A')}")
            ctx_parts.append(f"Audio Emotion: {results_context.get('audio_emotion', 'N/A')}")
            ctx_parts.append(f"Video Emotion: {results_context.get('video_emotion', 'N/A')}")
            ctx_parts.append(f"Confidence: {results_context.get('timeline_confidence', 'N/A')}")
            ctx_parts.append(f"Stability: {results_context.get('emotional_stability', 'N/A')}")
            ctx_parts.append(f"Reasoning: {results_context.get('reasoning', 'N/A')}")
            if results_context.get('audio_temporal'):
                ctx_parts.append(f"Audio Timeline: {', '.join(results_context['audio_temporal'])}")
            if results_context.get('video_temporal'):
                ctx_parts.append(f"Video Timeline: {', '.join(results_context['video_temporal'])}")
            if results_context.get('emotion_distribution'):
                ctx_parts.append(f"Distribution: {json.dumps(results_context['emotion_distribution'])}")

        context_str = '\n'.join(ctx_parts) if ctx_parts else 'No analysis results available yet.'

        # Build messages for Groq
        messages = [
            {"role": "system", "content": f"""You are a warm, empathetic AI therapist. The person you're talking to just had their emotions analyzed and here's what was detected:

{context_str}

How to behave:
- You KNOW this person's emotional state — just talk to them naturally as a therapist would
- Do NOT repeat analysis data, confidence scores, or technical details unless specifically asked
- For greetings (hi, hello) just reply with a short warm message (1 line)
- Keep responses SHORT (2-3 sentences max), warm, and natural
- Use exactly 1 emoji per response
- Validate their feelings, offer gentle perspective, suggest small actionable steps
- Only share specific analysis details if they explicitly ask (e.g. "what was my score?")
- If no results available, gently suggest they run an analysis first"""}
        ]

        # Add conversation history
        for msg in history:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

        messages.append({"role": "user", "content": user_message})

        headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 200
        }
        response = requests.post(GROQ_URL, headers=headers, json=payload)
        if response.status_code == 200:
            content = response.json()['choices'][0]['message']['content']
            return jsonify({'reply': content.strip()})
        else:
            return jsonify({'reply': 'Sorry, I couldn\'t process that right now. Please try again.'})

    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'reply': 'Something went wrong. Please try again.'})

if __name__ == '__main__':
    app.run(debug=True)
