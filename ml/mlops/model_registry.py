import json
import shutil
from pathlib import Path
import datetime

REGISTRY_DIR = Path(__file__).parent.parent.parent / "ml" / "registry"
REGISTRY_FILE = REGISTRY_DIR / "models.json"

class ModelRegistry:
    def __init__(self):
        REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
        if not REGISTRY_FILE.exists():
            with open(REGISTRY_FILE, "w") as f:
                json.dump([], f)
                
    def _load_registry(self):
        with open(REGISTRY_FILE, "r") as f:
            return json.load(f)
            
    def _save_registry(self, data):
        with open(REGISTRY_FILE, "w") as f:
            json.dump(data, f, indent=4)
            
    def register_model(self, weights_path, map50, map50_95, dataset_size):
        """
        Register a newly trained model.
        """
        registry = self._load_registry()
        
        # Determine next version
        version = f"v1.{len(registry)}"
        
        model_entry = {
            "version": version,
            "weights_path": str(weights_path),
            "map50": map50,
            "map50_95": map50_95,
            "dataset_size": dataset_size,
            "is_active": False,
            "created_at": datetime.datetime.utcnow().isoformat()
        }
        
        registry.append(model_entry)
        self._save_registry(registry)
        
        print(f"📦 Registered new model version {version}")
        return version
        
    def promote_model(self, version):
        """
        Promote a model version to active production use.
        """
        registry = self._load_registry()
        
        for model in registry:
            if model["version"] == version:
                model["is_active"] = True
            else:
                model["is_active"] = False
                
        self._save_registry(registry)
        print(f"🚀 Model {version} promoted to production!")
