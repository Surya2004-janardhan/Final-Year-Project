# EmotionAI

EmotionAI is a desktop-first multimodal emotion monitoring system.

At runtime, the Electron app captures webcam + microphone input, sends video to a Flask backend, runs audio/video emotion inference, generates cognitive summaries and LLM content, stores historical results locally, and can trigger native intervention notifications when negative emotional shifts are detected.

## 1) System-Level Architecture

### 1.1 Context Diagram (L0)

```text
User
  |
  | opens app / enables auto mode / views history
  v
Electron App (React UI + Electron Main)
  |                         | \
  | HTTP                    |  \ IPC + filesystem persistence
  v                         |   \
Flask Backend (app.py)      |    -> settings.json / results.json / analyses/*.json (userData)
  |                         |
  | uses                    |
  v                         |
TensorFlow Models           |
(audio_emotion_model.h5,    |
 video_emotion_model.h5)    |
  |
  | external HTTP
  v
Groq API + Saavn API
```

### 1.2 Backend Component Diagram (L1)

```text
Flask API Layer
  |- /process            -> core multimodal pipeline
  |- /status             -> progress polling state
  |- /history, /mappings -> SQLite storage access
  |- /analyze_history    -> LLM trend analysis
  |- /chat               -> LLM therapist assistant
  |- /music/search       -> song lookup + local cache

Core Processing Services
  |- FFmpeg normalization + audio extraction
  |- Video segmentation (OpenCV)
  |- Audio MFCC extraction (librosa)
  |- Batch inference (TensorFlow/Keras)
  |- Timeline aggregation + cognitive metrics

Persistence Services
  |- SQLite: history, music_mappings
  |- Local file cache: music/*.mp3

External Integrations
  |- Groq chat completions API
  |- saavn.sumit.co search API
```

### 1.3 Desktop Runtime Architecture (L1)

```text
Electron Main (frontend/main.cjs)
  |- Launches BrowserWindow + Tray
  |- Spawns backend child process: python app.py
  |- IPC for settings/history/cache/notifications

React Renderer (frontend/src)
  |- Dashboard, Settings, History, Chat
  |- Manual processing (upload/record)
  |- Auto-mode daemon (interval capture + background analysis)
```

## 2) End-to-End Processing Flow

### 2.1 Manual Analysis Sequence

```text
React UI -> POST /process (video blob/file)
Flask:
  1. save upload (temp_raw_video.webm)
  2. normalize container (ffmpeg -> temp_video.mp4)
  3. extract mono 16k audio (temp_audio.wav)
  4. create overlapping 1s windows every 0.5s
  5. video path: sample frames -> MobileNetV2 feature extractor -> video model
  6. audio path: MFCC windows -> audio model
  7. aggregate timeline -> dominant emotion + stability + transitions
  8. generate LLM content (or fallback templates)
  9. persist history row in SQLite
 10. cleanup temp files
 11. return JSON result
React UI -> polls /status for progress until complete
```

### 2.2 Auto Mode (Background Daemon) Sequence

```text
User enables Auto Mode
  -> useDaemon starts interval timer
  -> MediaRecorder captures webcam+mic for recordDurationMinutes
  -> sends blob to /process in background
  -> saves result via Electron IPC (results.json)
  -> compares latest emotion with rolling buffer
  -> if negative shift detected: native OS notification
     (ask-first or auto-play mapped local audio)
```

## 3) Backend Deep Dive

### 3.1 Model Loading and Runtime Initialization

At backend startup (`app.py`):
- Initializes SQLite tables (`history`, `music_mappings`)
- Loads models once:
  - `models/audio_emotion_model.h5`
  - `models/video_emotion_model.h5`
- Builds a MobileNetV2 feature extractor (`112x112x3`, ImageNet, frozen)
- Initializes global status object for progress polling
- Reads `GROQ_API_KEY` from environment

If model loading fails, `/process` returns `{"error": "Models not loaded"}`.

### 3.2 Input/Feature Configuration

Audio constants:
- Sample rate: `16000`
- MFCCs: `13`
- Hop length: `512`
- Window size: `25ms`
- Hop size: `10ms`
- Frames per sample: `300`

Video constants:
- Segment window: `1s`
- Segment stride: `0.5s`
- Frames per segment: `10`
- Frame size: `112x112`

Emotion classes (7):
- `neutral, happy, sad, angry, fearful, disgust, surprised`

### 3.3 Timeline Aggregation Logic

For each segment, backend produces modality predictions and converts them to temporal emotion labels.

Current dominant-emotion selection behavior in `app.py`:
- If both audio + video timelines exist, dominant timeline is derived from **video timeline** (`combined_emotions = video_emotions_temporal`)
- Otherwise whichever modality is available is used
- Confidence = count(dominant) / total segments
- Stability = `1 - (unique_emotions - 1) / 7`
- Transition rate = emotion changes / (segments - 1)

### 3.4 Cognitive + LLM Layers

Cognitive summary:
- Produces short reasoning text based on consistency and stability

LLM generation (`/process`, `/analyze_history`, `/chat`):
- Uses Groq endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Model: `llama-3.3-70b-versatile`
- JSON output hardening in `/process`: merges missing keys with fallback templates

Fallback behavior:
- If Groq call fails or malformed response occurs, backend returns deterministic fallback story/quote/video/books/songs by emotion.

### 3.5 Persistence Architecture

#### SQLite (`emotionai.db`)

`history` table:
- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `timestamp DATETIME DEFAULT CURRENT_TIMESTAMP`
- `fused_emotion TEXT`
- `audio_emotion TEXT`
- `video_emotion TEXT`
- `confidence REAL`
- `stability REAL`
- `reasoning TEXT`

`music_mappings` table:
- `emotion TEXT PRIMARY KEY`
- `music_path TEXT`

#### Electron userData persistence

Used by renderer + main process:
- `settings.json` for app settings
- `results.json` for analysis history shown in calendar/history view
- `analyses/<date>.json` for cached range-based AI trend reports

### 3.6 File/Media Lifecycle

Temporary files during `/process`:
- `temp_raw_video.webm`
- `temp_video.mp4`
- `temp_audio.wav`

Music cache:
- `music/<sanitized_song_id_title>.mp3`
- Served by `/downloaded_music/<filename>`

### 3.7 Progress and State Model

Global shared state:
- `progress_state = { progress, status, results }`
- Updated across pipeline stages and exposed via `GET /status`

Important characteristic:
- Single global object means concurrent `/process` requests share status state.

## 4) API Contract (Backend)

### 4.1 `GET /status`
Returns processing progress.

Response:
```json
{
  "progress": 70,
  "status": "Neural Audio Inference: Running Batch",
  "results": null
}
```

### 4.2 `POST /process`
Multipart form upload with field: `video`.

Returns (shape):
```json
{
  "audio_emotion": "sad",
  "video_emotion": "sad",
  "fused_emotion": "sad",
  "reasoning": "Mixed state: sad leads at 43.8% Moderate stability.",
  "story": "...",
  "quote": "...",
  "video": {"title":"...","channel":"...","link":"...","reason":"..."},
  "books": [{"title":"...","author":"...","reason":"...","purchase_link":"..."}],
  "songs": [{"artist":"...","title":"...","explanation":"..."}],
  "audio_temporal": ["sad", "neutral"],
  "video_temporal": ["sad", "sad"],
  "audio_probs_temporal": [[0.1,0.2]],
  "video_probs_temporal": [[0.2,0.1]],
  "time_points": [0,1,2],
  "timeline_confidence": 0.43,
  "emotional_stability": 0.71,
  "transition_rate": 0.28,
  "emotion_distribution": {"sad": 7, "neutral": 3}
}
```

### 4.3 `GET /music/search?q=...`
Searches song via Saavn API, caches locally when possible, returns metadata + preview URL.

### 4.4 History and mapping endpoints
- `GET /history?limit=50`
- `DELETE /history`
- `GET /mappings`
- `POST /mappings` with `{ "emotion": "sad", "music_path": "C:/.../track.mp3" }`

### 4.5 AI endpoints
- `POST /analyze_history` with `{ "history": [...] }`
- `POST /chat` with `{ "message": "...", "context": {...}, "history": [...] }`

### 4.6 Local stream endpoint
- `GET /stream_local?path=<absolute_path>`

## 5) Frontend/Desktop Integration with Backend

Key integration points:
- `frontend/src/main.jsx`: sets `axios.defaults.baseURL = 'http://localhost:5000'`
- Manual analysis checks backend status and starts it via IPC if needed
- Auto-mode daemon also starts backend on-demand
- Calendar view loads history from Electron `results.json` (or backend fallback outside Electron)

IPC handlers in `frontend/main.cjs`:
- Settings: `load-settings`, `save-settings`
- Results: `load-results`, `save-result`
- Analysis cache: `load-analysis`, `save-analysis`
- Backend control: `start-backend`, `stop-backend`, `backend-status`
- Notifications: `notify-shift`

## 6) Repository Map

```text
.
|-- app.py
|-- requirements.txt
|-- emotionai.db
|-- models/
|   |-- audio_emotion_model.h5
|   |-- video_emotion_model.h5
|   |-- fusion_emotion.h5
|   `-- haarcascade_frontalface_default.xml
|-- music/
|-- scripts/
|   |-- data_processing/
|   |-- model_training/
|   |-- model_testing/
|   `-- utils/
|-- tests/
|-- plots/
`-- frontend/
    |-- src/
    |-- main.cjs
    |-- package.json
    `-- vite.config.js
```

## 7) Setup and Run

### 7.1 Backend setup

```bash
python -m venv myenv
# Windows
myenv\Scripts\activate
# Linux/macOS
# source myenv/bin/activate

pip install -r requirements.txt
```

Set key:

```bash
# Windows cmd
set GROQ_API_KEY=your_key_here
# PowerShell
$env:GROQ_API_KEY="your_key_here"
# Linux/macOS
export GROQ_API_KEY=your_key_here
```

Run:

```bash
python app.py
```

Backend binds to `127.0.0.1:5000`.

### 7.2 Desktop app setup

```bash
cd frontend
npm install
npm run build
npm run electron:dist
```

## 8) Operational Characteristics

- Upload limit: `100MB` (`MAX_CONTENT_LENGTH`)
- Backend mode: Flask dev server, `debug=False`, `use_reloader=False`
- Inference style: batch over temporal windows for video/audio
- Music cache strategy: on-demand local caching in `music/`
- Window/tray behavior: app opens visible, closing hides to tray (keeps service alive)

## 9) Failure Modes and Recovery

1. Model load failure at startup
- Symptom: `/process` returns model-not-loaded error
- Recovery: verify model files in `models/`

2. FFmpeg normalization/extraction failure
- Recovery in code: falls back to raw video when normalization fails; audio path may be omitted

3. Groq API unavailable / malformed response
- Recovery in code: fallback content templates in `/process`; graceful fallback text in `/chat`

4. External music API failure
- Recovery in code: returns service-unavailable or remote stream URL without local cache

## 10) Security and Privacy Notes

- Captured media is temporarily stored during processing and removed afterward
- Historical analytics are stored locally (SQLite + Electron userData)
- `/stream_local` serves arbitrary absolute path if file exists; keep app on trusted local machine only
- Secrets: `GROQ_API_KEY` must be provided through environment variable

## 11) Known Gaps / Improvement Backlog

- `frontend/package.json` lacks `dev` script while `electron:start` expects it
- `/status` uses global process state and is not isolated per request/session
- Dominant timeline currently prefers video when both modalities are present
- Code contains legacy helper paths/functions that can be consolidated

## 12) Quick Reference: Important Files

- Backend entry: `app.py`
- Electron main process: `frontend/main.cjs`
- React app shell: `frontend/src/App.jsx`
- Background daemon hook: `frontend/src/hooks/useDaemon.js`
- Processing hook: `frontend/src/hooks/useProcessing.js`
- Settings hook: `frontend/src/hooks/useSettings.js`
- Calendar/insights: `frontend/src/components/CalendarView.jsx`

