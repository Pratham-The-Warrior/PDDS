import os
import io
import cv2
import numpy as np
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from ml.inference.pipeline import PDDSInferencePipeline

router = APIRouter()

# Initialize ML Pipeline globally so it stays in memory
# If weights don't exist yet, pipeline handles it gracefully
pipeline = PDDSInferencePipeline()

@router.post("/detect")
async def detect_package(file: UploadFile = File(...)):
    """
    Run YOLOv8-Seg inference on an uploaded image.
    Used for manual testing / REST interaction.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        # Read image into OpenCV format
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image.")

        # Run inference
        results = pipeline.process_frame(img)
        
        return JSONResponse(content={"success": True, "data": results})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_stats():
    """
    Returns high-level system statistics.
    """
    return {
        "throughput_per_min": 124,
        "defect_rate_pct": 8.2,
        "avg_latency_ms": 32.5,
        "reject_count": 45,
        "line_speed_m_s": 2.4
    }
