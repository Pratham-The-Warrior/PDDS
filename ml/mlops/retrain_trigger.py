from pathlib import Path

# Directory where edge cases are stored
EDGE_CASE_DIR = Path(__file__).parent.parent.parent / "datasets" / "edge_cases"

class RetrainManager:
    def __init__(self, buffer_capacity=500, trigger_threshold=400):
        self.buffer_capacity = buffer_capacity
        self.trigger_threshold = trigger_threshold
        
    def check_retrain_needed(self):
        """
        Check if the edge case buffer has reached the threshold to trigger a retraining run.
        """
        if not EDGE_CASE_DIR.exists():
            return False
            
        num_edge_cases = len(list(EDGE_CASE_DIR.glob("*.jpg")))
        
        if num_edge_cases >= self.trigger_threshold:
            print(f"⚠️ Retrain Triggered: Edge case buffer is {num_edge_cases}/{self.buffer_capacity} full.")
            return True
            
        return False
        
    def trigger_retraining(self):
        """
        This would launch a background job (e.g. Airflow or Jenkins) to:
        1. Merge edge cases into the main dataset
        2. Run ml/training/train.py
        3. Evaluate new model
        4. Promote to production if mAP improved
        """
        pass
