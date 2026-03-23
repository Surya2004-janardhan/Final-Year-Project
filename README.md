# EmotionAI

EmotionAI is a desktop-first multimodal emotion and stress-support system. It combines webcam video, microphone audio, TensorFlow inference, temporal reasoning, local history tracking, background monitoring, and AI-generated guidance to help a user understand emotional shifts over time.

This project has two major runtime parts:

- A Windows-focused Electron desktop app with a React renderer for dashboard, history, assistant, and settings
- A Flask backend that handles video/audio processing, emotion inference, cognitive summaries, chat, history analysis, and local media streaming

The system can run in manual mode or background auto mode. In auto mode, the desktop app records at user-defined intervals, processes captured media in the background, stores results locally, detects significant negative shifts, shows a system notification, and can auto-play a user-mapped local support song.

## Table of Contents

- [1. Project Goal](#1-project-goal)
- [2. What the System Does](#2-what-the-system-does)
- [3. High-Level Architecture](#3-high-level-architecture)
- [4. End-to-End Runtime Flow](#4-end-to-end-runtime-flow)
- [5. Backend Architecture](#5-backend-architecture)
- [6. Frontend and Desktop Architecture](#6-frontend-and-desktop-architecture)
- [7. Emotion and Stress Logic](#7-emotion-and-stress-logic)
- [8. AI Layers](#8-ai-layers)
- [9. Persistence and Data Storage](#9-persistence-and-data-storage)
- [10. API Reference](#10-api-reference)
- [11. Repository Map](#11-repository-map)
- [12. Important Components](#12-important-components)
- [13. Training and Research Assets](#13-training-and-research-assets)
- [14. Setup](#14-setup)
- [15. How to Run](#15-how-to-run)
- [16. Logging and Observability](#16-logging-and-observability)
- [17. Known Constraints](#17-known-constraints)
- [18. Future Improvements](#18-future-improvements)

## 1. Project Goal

The goal of EmotionAI is not just to classify an emotion label like `happy` or `sad`. The goal is to:

- detect emotional state using both face and voice
- track how that state changes over time
- identify stress-related shifts and instability
- preserve a local history of sessions
- generate understandable summaries for the user
- offer supportive interventions such as songs, books, videos, quotes, stories, and assistant responses

This project is designed around the idea that emotional change matters more than a single point-in-time prediction.

## 2. What the System Does

At runtime, EmotionAI can:

- capture webcam and microphone input
- record manually or automatically in the background
- normalize video with FFmpeg
- extract audio features with Librosa
- run video inference with TensorFlow/Keras
- run audio inference with TensorFlow/Keras
- aggregate temporal predictions into a dominant emotional state
- estimate a coarse stress score and stress label
- generate AI support content through Groq
- save results locally for history and time-based analysis
- show Windows system notifications when emotional shift rules are triggered
- optionally auto-play a user-mapped local support track

Supported emotion classes:

- `neutral`
- `happy`
- `sad`
- `angry`
- `fearful`
- `disgust`
- `surprised`

## 3. High-Level Architecture

```text
User
  |
  v
Electron Desktop App
  |- Electron Main Process
  |   |- launches BrowserWindow
  |   |- manages tray lifecycle
  |   |- starts Flask backend on demand
  |   |- stores persistent settings/results/analysis cache
  |   |- shows native notifications
  |
  `- React Renderer
      |- Dashboard
      |- History
      |- AI Assistant
      |- Settings
      |- Manual recording and upload
      |- Background daemon
      |- In-app playback for user-mapped local support tracks
      |
      v
Flask Backend (app.py)
  |- /process
  |- /status
  |- /history
  |- /analyze_history
  |- /chat
  |- /mappings
  |- /stream_local
  |
  v
ML and Service Layer
  |- TensorFlow/Keras models
  |- OpenCV
  |- Librosa
  |- FFmpeg
  `- Groq API
```

## 4. End-to-End Runtime Flow

### Manual analysis flow

```text
User records or uploads video
  -> React sends POST /process
  -> Flask saves raw media to temp files
  -> Flask normalizes the video with FFmpeg
  -> Flask extracts mono 16 kHz audio
  -> Flask validates human face presence
  -> Flask creates temporal video and audio segments
  -> Flask runs model inference
  -> Flask builds temporal emotion sequences
  -> Flask computes confidence, stability, transitions, and stress
  -> Flask asks Groq for support content
  -> Flask stores history in SQLite
  -> React displays dashboard cards, charts, insights, and content
```

### Auto mode flow

```text
User enables auto mode
  -> useDaemon starts a wait timer
  -> after interval, app records webcam + mic for configured duration
  -> recording ends
  -> next interval countdown begins immediately
  -> captured clip is processed in the background
  -> result is saved to local results store
  -> shift detection compares recent emotional states
  -> if shift detected, Electron sends system notification
  -> if auto-play is enabled and a song is mapped, app streams and plays the local file in-app
```

### History analysis flow

```text
User opens History tab
  -> React loads persistent results
  -> range filters group data by today, week, month, or all time
  -> charts and summaries are computed locally
  -> user can run AI trend analysis for current range
  -> Flask sends selected history to Groq
  -> summary is returned and cached locally
```

## 5. Backend Architecture

The backend lives primarily in [app.py](/c:/Users/chint/Desktop/4-2/4-2-project/app.py).

### Core responsibilities

- initialize SQLite tables
- load the audio and video emotion models
- define the MobileNetV2-based video feature extractor
- manage progress state for long-running jobs
- process uploaded or background-recorded media
- serve local files needed by the desktop app
- generate AI summaries and assistant responses

### Backend libraries

- Flask
- Flask-CORS
- TensorFlow / Keras
- OpenCV
- NumPy
- Librosa
- ffmpeg-python
- requests
- sqlite3

### Model loading

At startup, the backend loads:

- `models/audio_emotion_model.h5`
- `models/video_emotion_model.h5`
- a frozen `MobileNetV2` feature extractor for frame embeddings

If model loading fails, processing is blocked and `/process` returns an error.

### Media preprocessing

When `/process` is called:

1. the uploaded file is saved to a unique temp path
2. FFmpeg converts or normalizes the video stream
3. FFmpeg extracts audio as mono PCM at 16 kHz
4. OpenCV checks for a visible human face
5. temporal audio and video segments are created

### Audio inference path

Audio processing uses MFCC features.

Important parameters:

- sample rate: `16000`
- MFCC count: `13`
- hop length: `512`
- frame target: `300`

The audio model predicts emotion on temporal MFCC windows.

### Video inference path

Video processing uses:

- resized frames at `112x112`
- `NUM_FRAMES = 10` frames per segment
- MobileNetV2 feature extraction
- a dense emotion classifier on pooled features

### Job progress tracking

Processing state is tracked through a per-job in-memory structure:

- `progress`
- `status`
- `results`

This drives the frontend progress UI and daemon background status.

## 6. Frontend and Desktop Architecture

The desktop app lives under [frontend](/c:/Users/chint/Desktop/4-2/4-2-project/frontend).

### Main layers

- Electron main process: [frontend/main.cjs](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/main.cjs)
- React renderer app shell: [frontend/src/App.jsx](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/App.jsx)
- custom hooks for recorder, processing, daemon, and settings
- UI components for dashboard, charts, history, assistant, and settings

### Electron main process responsibilities

- create and manage the main window
- create the tray icon and tray menu
- persist settings and results in `userData`
- launch the Flask backend on demand
- reuse an already-running backend if port `5000` is occupied
- expose IPC handlers to the renderer
- display system notifications
- print terminal logs for Electron and forwarded renderer activity

### React renderer responsibilities

- manual capture and upload
- progress display
- temporal insight rendering
- assistant chat experience
- auto mode monitoring
- history and time-range analysis
- local in-app playback of user-mapped support tracks

### Main hooks

- [frontend/src/hooks/useMediaRecorder.js](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/hooks/useMediaRecorder.js)
  - camera and microphone permissions
  - live preview
  - manual recording

- [frontend/src/hooks/useProcessing.js](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/hooks/useProcessing.js)
  - calls `/process`
  - tracks progress
  - stores manual analysis results

- [frontend/src/hooks/useDaemon.js](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/hooks/useDaemon.js)
  - auto mode loop
  - background capture
  - background analysis
  - shift detection
  - notification flow

- [frontend/src/hooks/useSettings.js](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/hooks/useSettings.js)
  - persistent configuration
  - local music mappings

## 7. Emotion and Stress Logic

EmotionAI does not only return a class label. It also derives stress-related indicators from temporal behavior.

### Temporal outputs

The backend builds:

- `audio_temporal`
- `video_temporal`
- `audio_probs_temporal`
- `video_probs_temporal`
- `emotion_distribution`
- `time_points`

### Aggregated metrics

The backend computes:

- dominant emotion
- timeline confidence
- emotional stability
- transition rate
- estimated stress score
- estimated stress label

### Stress baseline map

Stress estimation starts from emotion-specific baselines:

- happy: low baseline
- neutral: low-moderate baseline
- surprised: medium baseline
- sad: elevated baseline
- disgust: elevated baseline
- fearful: high baseline
- angry: highest baseline

Then it adjusts using:

- transition rate
- emotional stability

The result is bucketed into:

- `low`
- `moderate`
- `high`

## 8. AI Layers

EmotionAI uses Groq for three separate AI behaviors.

### 1. Support content generation during `/process`

The backend asks Groq to produce:

- a short supportive story
- a tailored quote
- one video suggestion
- book suggestions
- song suggestions
- meme suggestions

If Groq fails, deterministic fallback content is returned by emotion.

### 2. Time-range analysis during `/analyze_history`

The History page can send historical results to Groq so the model explains:

- whether the user is improving or under pressure
- emotional trends across the selected range
- important shifts
- practical support suggestions

### 3. Assistant replies during `/chat`

The assistant uses:

- the latest result
- recent conversation memory
- recent stored historical runs

to answer questions in simple, supportive language.

## 9. Persistence and Data Storage

EmotionAI stores data in two places.

### SQLite database

File:

- [emotionai.db](/c:/Users/chint/Desktop/4-2/4-2-project/emotionai.db)

Used by the Flask backend for:

- analysis history
- music mappings

Important history fields include:

- timestamp
- fused emotion
- audio emotion
- video emotion
- confidence
- stability
- reasoning
- stress score
- stress label

### Electron userData persistence

Used by the desktop app for:

- `settings.json`
- `results.json`
- cached time-range analyses in `analyses/*.json`

This allows the app to restore settings and show history even across restarts.

## 10. API Reference

### `POST /process`

Input:

- multipart form data
- `video` file field

Output includes:

- `audio_emotion`
- `video_emotion`
- `fused_emotion`
- `reasoning`
- `story`
- `quote`
- `video`
- `books`
- `songs`
- `memes`
- `audio_temporal`
- `video_temporal`
- `audio_probs_temporal`
- `video_probs_temporal`
- `timeline_confidence`
- `emotional_stability`
- `transition_rate`
- `emotion_distribution`
- `stress_score`
- `stress_label`
- `job_id`

### `GET /status?job_id=...`

Returns current job progress and status.

### `GET /history?limit=...`

Returns recent history rows from SQLite.

### `DELETE /history`

Clears history rows from SQLite.

### `GET /mappings`

Returns current emotion-to-music mappings.

### `POST /mappings`

Accepts:

```json
{
  "emotion": "sad",
  "music_path": "C:/path/to/file.mp3"
}
```

### `POST /analyze_history`

Accepts selected history rows and returns an AI range summary.

### `POST /chat`

Accepts:

- current message
- current result context
- conversation history
- prior analysis history

Returns an assistant reply.

### `GET /stream_local?path=...`

Streams a local absolute path. The desktop app uses this for in-app playback of user-mapped intervention songs.

## 11. Repository Map

```text
.
|-- app.py
|-- README.md
|-- documentation.md
|-- plan.md
|-- requirements.txt
|-- emotionai.db
|-- models/
|-- plots/
|-- scripts/
|   |-- data_processing/
|   |-- model_training/
|   |-- model_testing/
|   `-- utils/
|-- tests/
`-- frontend/
    |-- main.cjs
    |-- package.json
    |-- package-lock.json
    |-- scripts/
    |-- public/
    `-- src/
        |-- App.jsx
        |-- main.jsx
        |-- index.css
        |-- components/
        |-- hooks/
        `-- utils/
```

## 12. Important Components

### Dashboard and analysis UI

- [frontend/src/components/RecordingPanel.jsx](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/components/RecordingPanel.jsx)
- [frontend/src/components/ProcessingLoader.jsx](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/components/ProcessingLoader.jsx)
- [frontend/src/components/EmotionCards.jsx](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/components/EmotionCards.jsx)
- [frontend/src/components/TemporalChart.jsx](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/components/TemporalChart.jsx)
- [frontend/src/components/CognitiveInsights.jsx](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/components/CognitiveInsights.jsx)
- [frontend/src/components/AIContent.jsx](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/components/AIContent.jsx)
- [frontend/src/components/InterventionPopup.jsx](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/components/InterventionPopup.jsx)

### History and assistant UI

- [frontend/src/components/CalendarView.jsx](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/components/CalendarView.jsx)
- [frontend/src/components/Chatbot.jsx](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/components/Chatbot.jsx)
- [frontend/src/components/SettingsView.jsx](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/components/SettingsView.jsx)

### Logging

- [frontend/src/utils/logger.js](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/src/utils/logger.js)

### Desktop runtime

- [frontend/main.cjs](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/main.cjs)
- [frontend/scripts/run-electron.cjs](/c:/Users/chint/Desktop/4-2/4-2-project/frontend/scripts/run-electron.cjs)

## 13. Training and Research Assets

The repository also contains training, testing, and visualization assets that support the runtime system.

### Data processing scripts

- [scripts/data_processing/organize_data.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/data_processing/organize_data.py)
- [scripts/data_processing/extract_audio_features.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/data_processing/extract_audio_features.py)
- [scripts/data_processing/extract_video_frames.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/data_processing/extract_video_frames.py)
- [scripts/data_processing/merge_and_relabel_datasets.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/data_processing/merge_and_relabel_datasets.py)

### Training scripts

- [scripts/model_training/train_audio_model.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/model_training/train_audio_model.py)
- [scripts/model_training/train_video_model.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/model_training/train_video_model.py)
- [scripts/model_training/train_complete_pipeline.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/model_training/train_complete_pipeline.py)
- [scripts/model_training/train_temporal_sequence.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/model_training/train_temporal_sequence.py)
- [scripts/model_training/train_temporal_video.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/model_training/train_temporal_video.py)
- [scripts/model_training/train_hybrid_multimodal.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/model_training/train_hybrid_multimodal.py)
- [scripts/model_training/train_improved_temporal.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/model_training/train_improved_temporal.py)
- [scripts/model_training/train_fer_model.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/model_training/train_fer_model.py)
- [scripts/model_training/run_training_pipeline.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/model_training/run_training_pipeline.py)

### Testing scripts

- [scripts/model_testing/test_model.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/model_testing/test_model.py)
- [scripts/model_testing/test_all_models.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/model_testing/test_all_models.py)
- [scripts/model_testing/fuse_models.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/model_testing/fuse_models.py)
- [scripts/model_testing/real_time_demo.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/model_testing/real_time_demo.py)

### Utility scripts

- [scripts/utils/data_loader.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/utils/data_loader.py)
- [scripts/utils/emotion_models.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/utils/emotion_models.py)
- [scripts/utils/face_detector.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/utils/face_detector.py)
- [scripts/utils/multimodal_emotion.py](/c:/Users/chint/Desktop/4-2/4-2-project/scripts/utils/multimodal_emotion.py)

## 14. Setup

### Prerequisites

- Python 3.10 or newer
- Node.js and npm
- Windows environment for the packaged desktop experience
- `GROQ_API_KEY` set in the environment

### Python setup

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Node setup

```powershell
cd frontend
npm install
```

### Environment variable

PowerShell:

```powershell
$env:GROQ_API_KEY="your_key_here"
```

## 15. How to Run

### Run backend only

```powershell
python app.py
```

Backend binds to:

- `http://127.0.0.1:5000`

### Run desktop app in development

```powershell
cd frontend
npm run electron:start
```

This starts:

- the Vite dev server on `127.0.0.1:5173`
- the Electron app
- the Flask backend when needed

### Build the frontend

```powershell
cd frontend
npm run build
```

### Build Windows desktop package

```powershell
cd frontend
npm run electron:build
```

## 16. Logging and Observability

The project now has end-to-end terminal logging.

### Backend logs

Backend logs include:

- API request start and end
- processing job start, progress, completion, and failure
- face-gate and FFmpeg stages
- history-analysis and chat requests

### Electron main logs

Electron logs include:

- backend start and reuse
- settings and result persistence
- window and tray lifecycle
- notifications

### Renderer logs

Renderer logs are forwarded into the terminal through Electron IPC and include:

- manual recording start and stop
- manual analysis flow
- background daemon recording and processing
- settings changes
- history loading and AI analysis
- in-app support song playback

## 17. Known Constraints

- The backend uses Flask development serving, not a production WSGI deployment
- The face gate requires a visible human face in recorded video
- Local streaming endpoints should be used only on a trusted local machine
- AI quality depends on the Groq API being available and properly configured
- Auto-play depends on valid local song mappings and accessible file paths
- The current implementation is Windows-oriented for packaging and runtime assumptions

## 18. Future Improvements

- stronger concurrent job isolation beyond current in-memory progress tracking
- improved multimodal fusion logic instead of current dominant timeline selection behavior
- richer longitudinal analytics and reporting
- better packaging, installer polish, and update flow
- stronger model evaluation documentation and reproducible training notebooks
- optional containerization of the backend
- expanded datasets and better generalization across conditions and demographics

## Summary

EmotionAI is a full-stack, multimodal affect-analysis system with:

- a React and Electron desktop experience
- a Flask processing backend
- TensorFlow audio and video inference
- temporal reasoning and stress estimation
- AI-generated support content and assistant replies
- persistent local history and settings
- background monitoring and intervention flow

This README is intended to be the main technical entry point for understanding how the full project is structured and how the pieces work together.
