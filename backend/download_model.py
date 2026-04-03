from huggingface_hub import hf_hub_download
import os

# Qwen 2.5 1.5B is open and very capable (SOTA for size)
MODEL_REPO = "bartowski/Qwen2.5-1.5B-Instruct-GGUF"
MODEL_FILE = "Qwen2.5-1.5B-Instruct-Q8_0.gguf"
LOCAL_DIR = "./models"

os.makedirs(LOCAL_DIR, exist_ok=True)

print(f"Downloading {MODEL_FILE} from {MODEL_REPO}...")
try:
    model_path = hf_hub_download(
        repo_id=MODEL_REPO,
        filename=MODEL_FILE,
        local_dir=LOCAL_DIR,
        local_dir_use_symlinks=False
    )
    print(f"Model downloaded to: {model_path}")
except Exception as e:
    print(f"Error downloading model: {e}")
