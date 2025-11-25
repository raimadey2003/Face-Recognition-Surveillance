# pipeline_manager.py
# Manages background processes: detector (script), aligner, extractor.
import os
import sys
import time
from multiprocessing import Process, Queue, get_context
from pathlib import Path
import subprocess

ROOT = Path(".").resolve()
SAVE_DIR = ROOT / ".save"
#ALIGNED_DIR = ROOT / "aligned_faces"
EMBED_DIR = ROOT / "embeddings"
RESULTS_DIR = ROOT / "results"

for d in (SAVE_DIR, EMBED_DIR, RESULTS_DIR):
    d.mkdir(parents=True, exist_ok=True)

# helper to ensure imports work when this file is run from uvicorn
def ensure_project_on_path():
    p = str(ROOT)
    if p not in sys.path:
        sys.path.insert(0, p)

ensure_project_on_path()

def run_detector_script():
    """
    Run your detector script as a separate process (keeps its UI / camera).
    Uses the same python interpreter.
    """
    # adjust path if test1_dt.py is inside a folder; this assumes it's in project root or importable
    script_candidates = [
        ROOT / "test1_dt.py",
        ROOT / "src" / "detection" / "test1_dt.py",
    ]
    script_path = None
    for c in script_candidates:
        if c.exists():
            script_path = str(c)
            break
    if script_path is None:
        raise FileNotFoundError("test1_dt.py not found in project root or src/detection/")
    cmd = [sys.executable, "-u", script_path]
    # use subprocess so detector runs independently and prints to its stdout
    proc = subprocess.Popen(cmd, cwd=str(ROOT))
    return proc

# def aligner_loop(poll_interval=0.6):
#     """
#     Poll SAVE_DIR, call face_alignment2.align_image for each new image.
#     """
#     ensure_project_on_path()
#     from time import sleep
#     try:
#         from face_alignment2 import align_image
#     except Exception as e:
#         # try alternative module path
#         try:
#             from src.face_alignment2 import align_image
#         except Exception:
#             raise

#     processed = set()
#     while True:
#         for f in sorted(SAVE_DIR.glob("*")):
#             if f.name in processed:
#                 continue
#             if f.suffix.lower() not in (".jpg", ".jpeg", ".png"):
#                 processed.add(f.name)
#                 continue
#             out = ALIGNED_DIR / f.name
#             try:
#                 align_image(str(f), str(out))
#                 print("[ALIGNER] aligned", f.name)
#             except Exception as exc:
#                 print("[ALIGNER] failed", f.name, exc)
#             processed.add(f.name)
#         sleep(poll_interval)

def extractor_loop(poll_interval=0.6):
    """
    Poll ALIGNED_DIR, call face_recog_core functions to compute embeddings, save .npy.
    """
    ensure_project_on_path()
    import numpy as np
    import csv
    from time import sleep
    try:
        import src.recognition.face_recog_core as frc
    except Exception:
        from src.recognition import face_recog_core as frc

    device = "cuda" if __import__("torch").cuda.is_available() else "cpu"
    print("[EXTRACTOR] loading model on", device)
    model = frc.load_model(device=device)  # adjust based on your function signature
    transform = frc.make_transform(160)   # if available
    index_csv = EMBED_DIR / "embeddings_index.csv"
    if not index_csv.exists():
        index_csv.write_text("image_file,embedding_file\n")

    processed = set()
    while True:
        for f in sorted(SAVE_DIR.glob("*")):
            if f.name in processed:
                continue
            if f.suffix.lower() not in (".jpg", ".jpeg", ".png"):
                processed.add(f.name)
                continue
            try:
                pil = frc.read_image(str(f))
                emb = frc.get_embedding_pytorch(pil, model, device, transform)
                if emb is None:
                    print("[EXTRACTOR] no embedding for", f.name)
                    processed.add(f.name)
                    continue
                emb_file = EMBED_DIR / (f.stem + ".npy")
                np.save(str(emb_file), emb)
                with open(index_csv, "a", newline="", encoding="utf-8") as csvf:
                    csv.writer(csvf).writerow([f.name, emb_file.name])
                print("[EXTRACTOR] saved embedding", emb_file.name)
            except Exception as exc:
                print("[EXTRACTOR] failed", f.name, exc)
            processed.add(f.name)
        sleep(poll_interval)

# manager that spawns processes
class PipelineManager:
    def __init__(self):
        self.detector_proc = None  # subprocess.Popen
        self.aligner_proc = None
        self.extractor_proc = None
        self.ctx = get_context("spawn")

    def start(self):
        if self.detector_proc is None:
            self.detector_proc = run_detector_script()
            print("[MANAGER] detector started pid", self.detector_proc.pid)

        # if self.aligner_proc is None:
        #     self.aligner_proc = self.ctx.Process(target=aligner_loop, name="Aligner")
        #     self.aligner_proc.daemon = True
        #     self.aligner_proc.start()
        #     print("[MANAGER] aligner started pid", self.aligner_proc.pid)

        if self.extractor_proc is None:
            self.extractor_proc = self.ctx.Process(target=extractor_loop, name="Extractor")
            self.extractor_proc.daemon = True
            self.extractor_proc.start()
            print("[MANAGER] extractor started pid", self.extractor_proc.pid)

    def stop(self):
        if self.detector_proc:
            try:
                self.detector_proc.terminate()
            except Exception:
                pass
            self.detector_proc = None
        if self.aligner_proc:
            try:
                self.aligner_proc.terminate()
            except Exception:
                pass
            self.aligner_proc = None
        if self.extractor_proc:
            try:
                self.extractor_proc.terminate()
            except Exception:
                pass
            self.extractor_proc = None

    def status(self):
        s = {
            "detector": bool(self.detector_proc and self.detector_proc.poll() is None),
            #"aligner": bool(self.aligner_proc and self.aligner_proc.is_alive()),
            "extractor": bool(self.extractor_proc and self.extractor_proc.is_alive()),
        }
        return s

# singleton manager for app
_manager = PipelineManager()

def get_manager():
    return _manager
