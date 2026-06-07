from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router as api_router
from backend.api.websocket import websocket_endpoint
import uvicorn

app = FastAPI(
    title="PDDS Real-Time ML Backend",
    description="Backend for the Package Damage Detection System",
    version="1.0.0"
)

# Allow React frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # React Dev Server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST routes
app.include_router(api_router, prefix="/api")

# Include WebSocket route manually
app.add_api_websocket_route("/ws/dashboard", websocket_endpoint)

@app.get("/")
def root():
    return {"status": "ok", "message": "PDDS Backend API is running."}

if __name__ == "__main__":
    print("🚀 Starting PDDS FastAPI Backend...")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
