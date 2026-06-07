import cv2
import numpy as np
import uuid
from pathlib import Path

# Edge case buffer directory
EDGE_CASE_DIR = Path(__file__).parent.parent.parent / "datasets" / "edge_cases"

class ActiveLearningSampler:
    def __init__(self, uncertainty_threshold_low=0.3, uncertainty_threshold_high=0.7):
        self.thresh_low = uncertainty_threshold_low
        self.thresh_high = uncertainty_threshold_high
        EDGE_CASE_DIR.mkdir(parents=True, exist_ok=True)
        
    def should_harvest(self, confidences):
        """
        Uncertainty Sampling:
        Harvest if any prediction falls in the uncertain zone (0.3 - 0.7).
        """
        if not len(confidences):
            return False
            
        for conf in confidences:
            if self.thresh_low <= conf <= self.thresh_high:
                return True
                
        return False

    def save_edge_case(self, image, predictions):
        """
        Save the edge case image and its model predictions for manual review/retraining.
        """
        case_id = str(uuid.uuid4())
        
        img_path = EDGE_CASE_DIR / f"{case_id}.jpg"
        cv2.imwrite(str(img_path), image)
        
        # In a real system, you'd also save the predictions as a JSON or YOLO txt file
        # so human annotators can correct them instead of starting from scratch.
        
        return case_id
