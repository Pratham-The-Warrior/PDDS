import time
from ml.inference.tracker import PackageTracker
from ml.inference.engine import InferenceEngine
from ml.inference.postprocess import calculate_surface_degradation, determine_severity

class PDDSInferencePipeline:
    def __init__(self, model_path="ml/weights/pdds_v1/weights/best.onnx"):
        self.tracker = PackageTracker()
        try:
            self.engine = InferenceEngine(model_path=model_path)
            self.model_loaded = True
        except Exception as e:
            print(f"Warning: Model not loaded. {e}")
            self.model_loaded = False
            
    def process_frame(self, frame):
        """
        End-to-end processing for a single frame.
        """
        start_time = time.time()
        
        # In a real setup, we first detect the package boundaries
        # For simplicity here, we assume the frame is cropped to the package
        h, w = frame.shape[:2]
        
        results = {
            "latency_ms": 0,
            "decision": "PASS",
            "degradation_ratio": 0.0,
            "severity": "CLEAN",
            "defects": []
        }
        
        if not self.model_loaded:
            return results
            
        # Step 1: Segmentation Inference
        predictions = self.engine.predict(frame)[0]
        
        # Step 2: Post-processing
        masks_pixel = []
        for i, mask_norm in enumerate(predictions["masks"]):
            # Convert normalized mask coords to pixel coords
            mask_px = mask_norm.copy()
            mask_px[:, 0] *= w
            mask_px[:, 1] *= h
            masks_pixel.append(mask_px)
            
            box = predictions["boxes"][i].tolist()
            cls_id = int(predictions["classes"][i])
            conf = float(predictions["confidences"][i])
            
            results["defects"].append({
                "class_id": cls_id,
                "confidence": conf,
                "bbox": box,
                "mask": mask_norm.tolist()
            })
            
        if masks_pixel:
            ratio = calculate_surface_degradation(masks_pixel, w, h)
            severity = determine_severity(ratio)
            
            results["degradation_ratio"] = ratio
            results["severity"] = severity
            
            if severity in ["HIGH", "CRITICAL"]:
                results["decision"] = "REJECT"
                
        results["latency_ms"] = (time.time() - start_time) * 1000
        return results
