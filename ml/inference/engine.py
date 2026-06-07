import numpy as np
from ultralytics import YOLO

class InferenceEngine:
    def __init__(self, model_path="weights/best.onnx", device=0):
        self.model = YOLO(model_path, task='segment')
        # Ultralytics will automatically use ONNXRuntime if the path is .onnx
        
    def predict(self, image):
        """
        Run inference on an image or batch of images.
        """
        # Run inference
        results = self.model(image, stream=False, verbose=False, conf=0.25)
        
        output = []
        for r in results:
            boxes = r.boxes.xyxy.cpu().numpy() if r.boxes else []
            classes = r.boxes.cls.cpu().numpy() if r.boxes else []
            confs = r.boxes.conf.cpu().numpy() if r.boxes else []
            
            # Masks are stored as polygons in segments
            masks = []
            if r.masks is not None:
                # segments are [N, 2] arrays of normalized x, y points
                masks = r.masks.xy
            
            output.append({
                "boxes": boxes,
                "classes": classes,
                "confidences": confs,
                "masks": masks
            })
            
        return output
