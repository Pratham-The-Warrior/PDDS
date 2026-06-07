import argparse
from pathlib import Path
from ultralytics import YOLO

PROJECT_ROOT = Path(__file__).parent.parent.parent
DEFAULT_WEIGHTS = PROJECT_ROOT / "ml" / "weights" / "pdds_v1" / "weights" / "best.pt"
DEFAULT_YAML = PROJECT_ROOT / "datasets" / "damaged-packages-sx9gw" / "custom_data.yaml"

def evaluate(weights_path, data_yaml):
    if not Path(weights_path).exists():
        print(f"❌ Error: Model weights not found at {weights_path}")
        return
    
    if not Path(data_yaml).exists():
        print(f"❌ Error: Dataset config not found at {data_yaml}")
        return

    print(f"📊 Evaluating model {weights_path} on dataset {data_yaml}...")
    
    model = YOLO(weights_path)
    
    # Run validation
    metrics = model.val(
        data=data_yaml,
        imgsz=416,
        batch=8,
        device=0,
        split='test',  # Evaluate on the test split
        project=str(PROJECT_ROOT / "ml" / "weights"),
        name="pdds_v1_eval",
        exist_ok=True
    )
    
    print("\n✅ Evaluation complete!")
    print(f"mAP@50 (Masks): {metrics.seg.map50:.4f}")
    print(f"mAP@50-95 (Masks): {metrics.seg.map:.4f}")
    print(f"mAP@50 (Boxes): {metrics.box.map50:.4f}")
    print(f"Results saved to: {PROJECT_ROOT / 'ml' / 'weights' / 'pdds_v1_eval'}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate trained YOLOv8 model")
    parser.add_argument("--weights", type=str, default=str(DEFAULT_WEIGHTS), help="Path to best.pt")
    parser.add_argument("--data", type=str, default=str(DEFAULT_YAML), help="Path to dataset yaml")
    args = parser.parse_args()
    
    evaluate(args.weights, args.data)
