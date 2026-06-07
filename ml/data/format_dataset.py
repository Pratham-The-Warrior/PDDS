import os
import yaml
from pathlib import Path
import shutil

# Target taxonomy
TARGET_CLASSES = [
    "crushed_corner",
    "punctured_surface",
    "open_flap",
    "torn_tape",
    "liquid_leak"
]

DATA_DIR = Path(__file__).parent.parent.parent / "datasets" / "damaged-packages-sx9gw"

def format_dataset():
    yaml_path = DATA_DIR / "data.yaml"
    
    if not yaml_path.exists():
        print(f"❌ Error: Could not find dataset yaml at {yaml_path}")
        print("Please ensure the dataset has been downloaded first.")
        return

    # Load current dataset info
    with open(yaml_path, 'r') as f:
        data = yaml.safe_load(f)

    current_classes = data.get('names', [])
    print(f"📦 Found dataset with classes: {current_classes}")
    
    # We will write out a new configured yaml for YOLOv8
    # If the classes are identical, we just copy it.
    # Otherwise, we warn the user that they might need to update the mappings.
    
    custom_yaml_path = DATA_DIR / "custom_data.yaml"
    
    # Create the custom configuration
    custom_data = data.copy()
    
    # Ensure paths are absolute or correctly relative for Ultralytics
    # Ultralytics looks relative to the directory containing the yaml
    custom_data['path'] = str(DATA_DIR.absolute())
    
    # For now, we will leave the classes as they are downloaded, 
    # but we will create this new yaml to be safely referenced by our training script.
    
    with open(custom_yaml_path, 'w') as f:
        yaml.dump(custom_data, f, default_flow_style=False)
        
    print(f"✅ Formatted dataset config saved to: {custom_yaml_path}")
    print("Next step: You can now run the training script!")

if __name__ == "__main__":
    format_dataset()
