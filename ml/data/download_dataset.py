import os
from dotenv import load_dotenv
from roboflow import Roboflow
from pathlib import Path

# Load environment variables
load_dotenv()

# Configuration
API_KEY = os.getenv("ROBOFLOW_API_KEY")
# Using a publicly available parcel damage instance segmentation dataset
WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE", "nabil-9sing")
PROJECT = os.getenv("ROBOFLOW_PROJECT", "damaged-packages-sx9gw")
VERSION = int(os.getenv("ROBOFLOW_VERSION", 2))
FORMAT = "yolov8"

DATA_DIR = Path(__file__).parent.parent.parent / "datasets"

def download_dataset():
    if not API_KEY:
        print("❌ Error: ROBOFLOW_API_KEY environment variable not found.")
        print("Please create a .env file in the project root and add your Roboflow API key:")
        print("ROBOFLOW_API_KEY=your_key_here")
        print("\nYou can get a free API key by signing up at https://app.roboflow.com")
        return

    print(f"📦 Downloading dataset {WORKSPACE}/{PROJECT} v{VERSION}...")
    
    # Ensure dataset directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    rf = Roboflow(api_key=API_KEY)
    project = rf.workspace(WORKSPACE).project(PROJECT)
    version = project.version(VERSION)
    
    # Download dataset into the datasets directory
    dataset = version.download(FORMAT, location=str(DATA_DIR / PROJECT))
    
    print(f"✅ Dataset successfully downloaded to: {dataset.location}")
    print("Next step: Run 'python ml/data/format_dataset.py' if class formatting is needed.")

if __name__ == "__main__":
    download_dataset()
