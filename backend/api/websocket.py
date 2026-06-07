import asyncio
import json
import random
from fastapi import WebSocket, WebSocketDisconnect

# This simulates the camera feed triggers to test the dashboard connectivity
# In a fully deployed hardware system, this would be triggered by RTSP frames.
async def generate_mock_telemetry(websocket: WebSocket):
    defects = ["crushed_corner", "punctured_surface", "open_flap", "torn_tape", "liquid_leak"]
    package_id = 1000
    
    while True:
        await asyncio.sleep(0.5) # 500ms tick rate
        
        # 1. Base telemetry update
        payload = {
            "type": "TICK",
            "stats": {
                "throughput": int(random.gauss(120, 5)),
                "latency": round(random.gauss(28, 6), 1),
                "defect_rate": round(random.uniform(5.0, 9.0), 1),
                "uptime": 99.9,
            }
        }
        await websocket.send_text(json.dumps(payload))
        
        # 2. Package Detection Event (simulated arrival)
        if random.random() < 0.3:  # 30% chance per tick to see a package
            is_damaged = random.random() < 0.15
            severity = "CLEAN"
            decision = "PASS"
            detected_defects = []
            
            if is_damaged:
                defect = random.choice(defects)
                severity = random.choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
                decision = "REJECT" if severity in ["HIGH", "CRITICAL"] else "PASS"
                detected_defects.append({
                    "type": defect,
                    "confidence": round(random.uniform(0.6, 0.95), 2),
                    "bbox": [10, 10, 100, 100]
                })
                
            package_id += 1
            camera_id = f"CAM-0{random.randint(1,4)}"
            
            det_payload = {
                "type": "DETECTION",
                "data": {
                    "package_id": f"PKG-{package_id}",
                    "camera": camera_id,
                    "decision": decision,
                    "severity": severity,
                    "defects": detected_defects,
                    "latency": round(random.uniform(25, 42), 1)
                }
            }
            await websocket.send_text(json.dumps(det_payload))

async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🔌 Dashboard client connected to WebSocket.")
    
    try:
        # Start streaming data
        await generate_mock_telemetry(websocket)
    except WebSocketDisconnect:
        print("🔌 Dashboard client disconnected.")
    except Exception as e:
        print(f"WebSocket Error: {e}")
