import argparse
from pathlib import Path
from ultralytics import YOLO

PROJECT_ROOT = Path(__file__).parent.parent.parent
DEFAULT_WEIGHTS = PROJECT_ROOT / "ml" / "weights" / "pdds_v1" / "weights" / "best.pt"

def export_model(weights_path):
    if not Path(weights_path).exists():
        print(f"❌ Error: Model weights not found at {weights_path}")
        return

    print(f"🔄 Exporting model {weights_path} to ONNX format...")
    
    model = YOLO(weights_path)
    
    # Export the model to ONNX format.
    # Half=True enables FP16 precision, which runs faster on modern GPUs (like RTX 2050)
    # Simplify=True simplifies the ONNX graph
    path = model.export(
        format="onnx",
        half=True,       # FP16 precision
        simplify=True,   # simplify graph
        opset=12,        # ONNX opset version
        dynamic=False    # Dynamic axes can cause issues in some deployment environments
    )
    
    print(f"✅ Model exported successfully to: {path}")
    print("This ONNX model can now be deployed in the FastAPI backend or Edge devices.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export trained YOLOv8 model to ONNX")
    parser.add_argument("--weights", type=str, default=str(DEFAULT_WEIGHTS), help="Path to best.pt")
    args = parser.parse_args()
    
    export_model(args.weights)
