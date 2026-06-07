import numpy as np

class PackageTracker:
    def __init__(self, iou_threshold=0.3, max_lost=5):
        self.tracked_packages = {}
        self.next_id = 1
        self.iou_threshold = iou_threshold
        self.max_lost = max_lost
        
    def update(self, detected_bboxes):
        """
        detected_bboxes: List of [x1, y1, x2, y2]
        Returns: Dict of {track_id: [x1, y1, x2, y2]}
        """
        # A simple centroid tracking or IoU-based tracking implementation goes here.
        # This is a placeholder for the actual implementation.
        # In a real conveyor belt scenario, packages move in a predictable direction.
        
        current_tracked = {}
        # Naive assignment for now
        for bbox in detected_bboxes:
            current_tracked[self.next_id] = bbox
            self.next_id += 1
            
        return current_tracked
