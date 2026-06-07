# PDDS Backend — Full ML/DL System Plan

> Building a production-grade computer vision backend: synthetic data generation → model training → two-stage inference → real-time API → active learning loop.

---

## Open Questions

> [!IMPORTANT]
> **GPU Availability**: Do you have a CUDA-capable GPU on this machine? This determines whether we train locally or prepare scripts for cloud/Colab execution. YOLOv8-Seg training needs at minimum a 6GB VRAM GPU (RTX 3060+). Without a GPU, we can still build the full pipeline but training will be slow or done externally.

> [!IMPORTANT]
> **Deployment Target**: Is this for a portfolio demo (runs locally, processes uploaded images) or should we also prepare Docker/cloud deployment configs?

> [!NOTE]
> **Real Images vs. Fully Synthetic**: We'll generate a fully synthetic dataset since real damaged-package datasets are scarce. However, the pipeline is designed so you can drop in real annotated images later and retrain seamlessly.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PDDS SYSTEM ARCHITECTURE                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     REACT DASHBOARD                       │   │
│  │  (Already Built — will connect via WebSocket)             │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │ WebSocket + REST                      │
│  ┌──────────────────────┴───────────────────────────────────┐   │
│  │                  FASTAPI BACKEND SERVER                    │   │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌─────────┐ │   │
│  │  │ REST API│  │WebSocket │  │ Image      │  │ MLOps   │ │   │
│  │  │ Routes  │  │ Streaming│  │ Upload/    │  │ API     │ │   │
│  │  │         │  │          │  │ Inference  │  │         │ │   │
│  │  └────┬────┘  └────┬─────┘  └─────┬──────┘  └────┬────┘ │   │
│  └───────┼────────────┼──────────────┼───────────────┼──────┘   │
│          │            │              │               │           │
│  ┌───────┴────────────┴──────────────┴───────────────┴──────┐   │
│  │                 INFERENCE ENGINE (Python)                  │   │
│  │                                                           │   │
│  │  Stage 1: Package Tracker        Stage 2: YOLOv8-Seg      │   │
│  │  ┌─────────────────────┐        ┌─────────────────────┐   │   │
│  │  │ Centroid/ByteTrack  │───ROI──│ Instance Segmentation│  │   │
│  │  │ Lightweight (~3ms)  │ crop   │ 5 Defect Classes     │  │   │
│  │  └─────────────────────┘        │ Polygon Masks        │  │   │
│  │                                 └──────────┬───────────┘   │   │
│  │                                            │               │   │
│  │  ┌─────────────────────────────────────────┴──────────┐   │   │
│  │  │ Post-Processing                                     │   │   │
│  │  │ • Surface Degradation Ratio = defect_px / total_px  │   │   │
│  │  │ • Defect polygon → convex hull → area calculation   │   │   │
│  │  │ • Multi-defect aggregation per package              │   │   │
│  │  │ • Confidence thresholding + NMS                     │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────┐  ┌────────────────────────────────────┐   │
│  │   SQLite DB       │  │   MLOps / Active Learning          │   │
│  │                   │  │                                    │   │
│  │ • detections      │  │ • Uncertainty sampling             │   │
│  │ • packages        │  │ • Edge-case buffer (images+preds)  │   │
│  │ • metrics         │  │ • Retraining trigger logic         │   │
│  │ • edge_cases      │  │ • Model versioning & A/B compare   │   │
│  │ • model_versions  │  │ • Automated evaluation reports     │   │
│  └──────────────────┘  └────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              TRAINING PIPELINE (Offline)                   │   │
│  │                                                           │   │
│  │  Synthetic Data Gen → Augmentation → YOLOv8-Seg Train     │   │
│  │  → Evaluation (mAP/IoU) → ONNX Export → Deploy            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
AMSS/
├── src/                          # React frontend (✅ already built)
├── backend/
│   ├── main.py                   # FastAPI entry point
│   ├── config.py                 # Configuration (paths, thresholds)
│   ├── api/
│   │   ├── routes.py             # REST endpoints
│   │   └── websocket.py          # WebSocket streaming handler
│   ├── db/
│   │   ├── database.py           # SQLite connection + session
│   │   ├── models.py             # SQLAlchemy ORM models
│   │   └── crud.py               # Database operations
│   └── services/
│       ├── detection_service.py  # Orchestrates inference + DB + WS
│       └── metrics_service.py    # Aggregates stats for dashboard
│
├── ml/
│   ├── data/
│   │   ├── generate_synthetic.py # Synthetic damaged package generator
│   │   ├── augmentations.py      # Albumentations pipeline
│   │   ├── dataset.yaml          # YOLOv8 dataset config
│   │   └── splits/               # train/val/test splits
│   │       ├── images/
│   │       └── labels/
│   ├── training/
│   │   ├── train.py              # YOLOv8-Seg training script
│   │   ├── evaluate.py           # mAP, IoU, confusion matrix
│   │   ├── export.py             # ONNX/TensorRT export
│   │   └── hyperparams.yaml      # Training hyperparameters
│   ├── inference/
│   │   ├── engine.py             # YOLOv8-Seg inference wrapper
│   │   ├── tracker.py            # Centroid/ByteTrack package tracker
│   │   ├── pipeline.py           # Two-stage orchestration
│   │   └── postprocess.py        # Mask→polygon→degradation ratio
│   ├── mlops/
│   │   ├── active_learning.py    # Edge case harvesting logic
│   │   ├── model_registry.py     # Version control for models
│   │   ├── retrain_trigger.py    # When to retrain decisions
│   │   └── evaluation_report.py  # Automated eval on new data
│   └── weights/                  # Saved model checkpoints
│       └── .gitkeep
│
├── tests/
│   ├── test_inference.py         # Inference pipeline tests
│   ├── test_api.py               # API endpoint tests
│   └── test_postprocess.py       # Degradation ratio tests
│
└── requirements.txt              # Python dependencies
```

---

## Proposed Changes — Phase by Phase

### Phase 1: Synthetic Dataset Generation

This is the foundation — without good data, the model is useless.

#### [NEW] `ml/data/generate_synthetic.py`

Generates ~5,000 annotated images of packages with procedural damage:

**Clean Package Generation:**
- Render 3D-perspective cardboard boxes using OpenCV geometric primitives
- Vary: size (20–60cm), color (kraft brown, white, gray), tape patterns, label placements
- Random warehouse backgrounds (concrete floors, conveyor textures, metal surfaces)
- Apply realistic lighting variation (directional, diffuse, shadow casting)

**Damage Synthesis — 5 Defect Types:**

| Defect | Generation Method | Mask Type |
|---|---|---|
| `crushed_corner` | Warp corner vertices inward using affine transforms, add crease lines with varying depth | Polygon mask covering deformed region |
| `punctured_surface` | Cut irregular hole shapes via alpha compositing, expose "inner" texture (darker corrugated pattern) | Polygon mask of hole boundary |
| `open_flap` | Detach one box flap, rotate it outward with perspective transform, add shadow underneath | Polygon mask of exposed opening |
| `torn_tape` | Render tape strips, then apply Bezier-curve tear patterns with ragged edges | Polygon mask of torn section |
| `liquid_leak` | Generate fluid stain patterns using Perlin noise + gradient, darken affected surface | Polygon mask of wet/stained area |

**Annotation Format:**
- YOLO segmentation format: `class x1 y1 x2 y2 ... xn yn` (normalized polygon coordinates)
- Also export COCO JSON for evaluation tooling
- Per-image metadata: defect type, severity level, surface degradation ground truth

**Dataset Split:**
- Train: 70% (~3,500 images)
- Validation: 15% (~750 images)
- Test: 15% (~750 images)
- Stratified split ensuring all defect types are represented proportionally

#### [NEW] `ml/data/augmentations.py`

Warehouse-realistic augmentation pipeline using **Albumentations**:

```
- RandomBrightnessContrast (simulate warehouse lighting flicker)
- GaussNoise + ISONoise (sensor noise at high shutter speed)
- MotionBlur (residual at 2.4 m/s line speed)
- RandomShadow (overhead structures)
- HueSaturationValue (color temp variation)
- Perspective + Affine (slight camera misalignment)
- CLAHE (adaptive histogram equalization)
- CoarseDropout (occlusion from other packages)
```

---

### Phase 2: YOLOv8-Seg Model Training

#### [NEW] `ml/training/train.py`

Full training script using **Ultralytics** library:

- Load `yolov8m-seg` pretrained weights (medium model — good accuracy/speed tradeoff)
- Fine-tune on our 5-class synthetic dataset
- Training config:
  - **Epochs**: 100 with early stopping (patience=15)
  - **Batch size**: 16 (adjust for available VRAM)
  - **Image size**: 640×640
  - **Optimizer**: AdamW with cosine annealing LR schedule
  - **Loss**: Box loss + Segmentation loss + Classification loss (YOLOv8 defaults)
  - **Augmentation**: Mosaic, MixUp, Copy-Paste (built into Ultralytics)

#### [NEW] `ml/training/evaluate.py`

Comprehensive evaluation beyond basic mAP:

- **Per-class mAP@50** and **mAP@50:95** 
- **Per-class IoU** for segmentation masks
- **Confusion matrix** with visualization
- **Precision-Recall curves** per defect type
- **Inference latency benchmarking** (mean, P95, P99)
- **Surface degradation accuracy**: compare predicted mask area vs. ground-truth degradation ratio
- **False positive/negative analysis**: catalog failure modes
- Export all results as JSON + matplotlib plots

#### [NEW] `ml/training/export.py`

Model export for deployment:
- Export to **ONNX** format (cross-platform inference)
- Optional **TensorRT** export (if NVIDIA GPU available)
- Quantization: FP16 and INT8 variants for edge deployment
- Benchmark inference speed across export formats

---

### Phase 3: Two-Stage Inference Engine

The core ML pipeline that runs in real-time.

#### [NEW] `ml/inference/tracker.py` — Stage 1: Package Localization

Lightweight tracking network for package boundary detection:

- **Approach**: Background subtraction (MOG2) + contour detection for package segmentation on the conveyor
- **Alternative**: Centroid-based tracker using simple IoU matching across frames
- **Purpose**: Track individual packages, assign persistent IDs, determine ROI crop coordinates
- **Latency target**: ≤5ms per frame
- Outputs: `List[TrackedPackage]` with bounding box, track ID, velocity estimate, frame count

#### [NEW] `ml/inference/engine.py` — Stage 2: YOLOv8-Seg Inference

Wrapper around the trained model:

- Load ONNX or PyTorch model
- Preprocess: resize, normalize, letterbox padding
- Run inference on cropped ROI from tracker
- Return: bounding boxes, class labels, confidence scores, polygon segmentation masks
- Support batch inference (process all 4 camera crops simultaneously)
- **Latency target**: ≤35ms per batch of 4 images

#### [NEW] `ml/inference/postprocess.py` — Surface Degradation Calculator

Convert raw model output into actionable metrics:

```python
def calculate_surface_degradation(mask_polygon, package_bbox):
    """
    Surface Degradation Ratio = area(defect_mask) / area(package_surface)
    
    For multi-defect packages:
    - Union all defect masks
    - Calculate total degraded surface percentage
    - Assign severity: LOW (<5%), MEDIUM (5-15%), HIGH (15-30%), CRITICAL (>30%)
    """
```

- Polygon mask → pixel area calculation using Shoelace formula
- Multi-defect aggregation (package can have multiple damage types)
- Severity classification based on degradation ratio thresholds
- Reject decision logic: reject if ANY defect is CRITICAL or total degradation > threshold

#### [NEW] `ml/inference/pipeline.py` — Two-Stage Orchestrator

Ties tracker + segmentation + postprocessing together:

```
Frame Input (4 cameras) 
  → Stage 1: Track packages across cameras (~3ms)
  → Crop ROIs for each tracked package
  → Stage 2: YOLOv8-Seg on ROIs (~30ms)
  → Post-process: masks → degradation ratios
  → Decision: PASS / REJECT / EDGE_CASE
  → Emit results to WebSocket + Database
  
Total target: ≤45ms end-to-end
```

---

### Phase 4: FastAPI Backend Server

#### [NEW] `backend/main.py`

FastAPI application with:
- CORS middleware (for React frontend)
- Startup event: load ML model, connect DB
- Shutdown event: cleanup resources

#### [NEW] `backend/api/routes.py`

REST API endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/detect` | Upload image(s) → run inference → return detections |
| `POST` | `/api/detect/batch` | Upload multiple images for batch processing |
| `GET` | `/api/detections` | Query historical detections (with filters) |
| `GET` | `/api/detections/{id}` | Get single detection with full mask data |
| `GET` | `/api/stats` | Aggregated statistics (throughput, defect rates) |
| `GET` | `/api/stats/timeseries` | Time-series metrics for charts |
| `GET` | `/api/defects/breakdown` | Defect type distribution |
| `GET` | `/api/model/info` | Current model version, mAP, status |
| `POST` | `/api/model/evaluate` | Trigger evaluation on test set |
| `GET` | `/api/mlops/edge-cases` | List harvested edge cases |
| `POST` | `/api/mlops/retrain` | Trigger retraining with edge cases |

#### [NEW] `backend/api/websocket.py`

Real-time WebSocket streaming:

- **Connection handler**: Authenticate and register dashboard clients
- **Simulation mode**: Run the inference pipeline on a loop using test images, streaming results to the dashboard (replaces client-side simulation)
- **Live mode**: Process uploaded image streams in real-time
- **Message types**: `DETECTION`, `STATS_UPDATE`, `EVENT`, `ALERT`, `MLOPS_UPDATE`
- Push frequency: every 500ms (batched updates)

---

### Phase 5: SQLite Database

#### [NEW] `backend/db/models.py`

SQLAlchemy ORM models:

```
packages
├── id (UUID)
├── timestamp
├── is_damaged (bool)
├── total_degradation (float)
├── reject_decision (PASS/REJECT/EDGE_CASE)
├── inference_latency_ms (float)
└── camera_id (str)

defect_instances
├── id (UUID)
├── package_id (FK → packages)
├── defect_type (enum: 5 types)
├── confidence (float)
├── mask_polygon (JSON — list of [x,y] points)
├── bbox (JSON — [x1,y1,x2,y2])
├── degradation_ratio (float)
└── severity (LOW/MEDIUM/HIGH/CRITICAL)

system_metrics (sampled every 5s)
├── timestamp
├── throughput_per_min (int)
├── defect_rate_pct (float)
├── avg_latency_ms (float)
├── reject_count (int)
└── line_speed (float)

edge_cases
├── id (UUID)
├── package_id (FK → packages)
├── image_path (str)
├── prediction (JSON)
├── confidence (float)
├── reason (str — why it's an edge case)
├── status (PENDING/ANNOTATED/USED_IN_TRAINING)
└── created_at

model_versions
├── id (UUID)
├── version (str — semantic versioning)
├── weights_path (str)
├── map50 (float)
├── map50_95 (float)
├── training_samples (int)
├── is_active (bool)
└── created_at
```

---

### Phase 6: MLOps Active Learning Pipeline

#### [NEW] `ml/mlops/active_learning.py`

Edge case harvesting with two sampling strategies:

**1. Uncertainty Sampling:**
- Harvest predictions where model confidence is in the "uncertain zone" (0.3–0.7)
- Also harvest high-confidence false positives (clean packages predicted as damaged with >0.8 confidence — detected via size/position heuristics)

**2. Diversity Sampling:**
- Extract feature embeddings from the YOLOv8 backbone (penultimate layer)
- Cluster embeddings using K-Means
- Select edge cases that are furthest from existing cluster centers
- Ensures retraining data covers diverse failure modes, not just repeated similar cases

**Buffer Management:**
- Ring buffer of max 500 edge cases (configurable)
- FIFO eviction when full, but prioritize higher-uncertainty samples
- Track harvest rate (edge cases/hour) as a model health indicator

#### [NEW] `ml/mlops/retrain_trigger.py`

Automated retraining decision logic:

```python
def should_retrain():
    """
    Trigger retraining when ANY of these conditions are met:
    1. Edge-case buffer > 80% full (400/500)
    2. Rolling defect-rate drift > 2σ from baseline
    3. Model confidence distribution shift (KL divergence > threshold)
    4. Manual trigger via API
    """
```

#### [NEW] `ml/mlops/model_registry.py`

Model version management:
- Save model checkpoints with metadata (mAP, training date, dataset size)
- A/B comparison: evaluate new model vs. current on held-out test set
- Promote new model only if mAP improves by ≥ 0.5%
- Rollback capability if production metrics degrade

#### [NEW] `ml/mlops/evaluation_report.py`

Automated evaluation report generation:
- Compare old vs. new model across all metrics
- Generate per-class improvement/degradation analysis
- Create visual report (plots + tables) saved as HTML/PDF
- Log to model registry

---

### Phase 7: Dashboard Integration

#### [MODIFY] `src/simulation/useSimulation.js`

Replace the client-side `PackageSimulator` with a WebSocket connection:

- Connect to `ws://localhost:8000/ws/dashboard`
- Parse incoming messages and update React state
- Fallback to simulation mode if backend is unavailable
- Add toggle: "Simulation Mode" vs. "Live Backend"

#### [MODIFY] `src/components/CameraGrid/CameraGrid.jsx`

- Add image upload functionality: drag-and-drop an image onto a camera feed
- Display the actual inference result (bounding boxes + masks overlaid on the uploaded image)
- Show real segmentation masks instead of simulated bounding boxes

---

## Dependencies

```
# requirements.txt
# Core ML
ultralytics>=8.2.0          # YOLOv8-Seg training & inference
torch>=2.0.0                # PyTorch backend
torchvision>=0.15.0         # Vision transforms
onnxruntime>=1.17.0         # ONNX inference (CPU fallback)

# Data Generation & Augmentation
opencv-python>=4.9.0        # Image processing, synthetic generation
albumentations>=1.4.0       # Augmentation pipeline
numpy>=1.24.0               # Array operations
Pillow>=10.0.0              # Image I/O
noise>=1.2.2                # Perlin noise for liquid leak generation
scikit-image>=0.22.0        # Image processing utilities

# Backend
fastapi>=0.110.0            # API framework
uvicorn[standard]>=0.27.0   # ASGI server
websockets>=12.0            # WebSocket support
python-multipart>=0.0.9     # File upload support

# Database
sqlalchemy>=2.0.0           # ORM
aiosqlite>=0.20.0           # Async SQLite

# MLOps
scikit-learn>=1.4.0         # Clustering, metrics
matplotlib>=3.8.0           # Visualization
seaborn>=0.13.0             # Statistical plots

# Utilities
pydantic>=2.0.0             # Data validation
python-dotenv>=1.0.0        # Environment config
tqdm>=4.66.0                # Progress bars
```

---

## Verification Plan

### Automated Tests

```bash
# Run inference pipeline tests
python -m pytest tests/test_inference.py -v

# Run API endpoint tests
python -m pytest tests/test_api.py -v

# Run postprocessing tests
python -m pytest tests/test_postprocess.py -v
```

### ML Evaluation

```bash
# Train model
python ml/training/train.py

# Evaluate on test set
python ml/training/evaluate.py --model weights/best.pt --data ml/data/dataset.yaml

# Benchmark latency
python ml/training/evaluate.py --benchmark --model weights/best.onnx
```

### Integration Test

```bash
# Start backend
uvicorn backend.main:app --port 8000

# Start frontend
npm run dev

# Upload test image via dashboard or curl
curl -X POST http://localhost:8000/api/detect \
  -F "file=@test_package.jpg"
```

### Success Criteria

| Metric | Target |
|---|---|
| mAP@50 (5 classes) | ≥ 0.75 on synthetic test set |
| mAP@50:95 | ≥ 0.50 |
| Inference latency (single image) | ≤ 40ms on GPU, ≤ 200ms on CPU |
| End-to-end pipeline latency | ≤ 45ms on GPU |
| API response time (single detect) | ≤ 500ms including I/O |
| WebSocket streaming rate | ≥ 2 updates/second |
| Surface degradation accuracy | ±5% vs. ground truth |
| Edge case harvest rate | Capture ≥ 90% of uncertain predictions |

---

## Execution Order

```
Phase 1: Synthetic Data (generate_synthetic.py, augmentations.py)
    ↓
Phase 2: Model Training (train.py, evaluate.py, export.py)
    ↓
Phase 3: Inference Engine (tracker.py, engine.py, postprocess.py, pipeline.py)
    ↓
Phase 4: Backend Server (main.py, routes.py, websocket.py)
    ↓
Phase 5: Database (models.py, crud.py)
    ↓
Phase 6: MLOps (active_learning.py, retrain_trigger.py, model_registry.py)
    ↓
Phase 7: Dashboard Integration (useSimulation.js → WebSocket, CameraGrid upload)
```

> [!WARNING]
> **Phase 2 (Training) is the bottleneck.** On a GPU, training takes ~2-4 hours. On CPU only, it could take 12+ hours. We can proceed with Phases 3-7 using a pre-downloaded YOLOv8 model while our custom model trains in the background.
