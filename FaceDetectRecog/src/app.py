# # # app.py
# from fastapi import FastAPI, UploadFile, File, HTTPException, Query
# from fastapi.responses import StreamingResponse, JSONResponse
# from pathlib import Path
# import shutil, io, csv
# import numpy as np
# from PIL import Image, ImageDraw, ImageFont
# import os
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import StreamingResponse, JSONResponse
# from src.pipeline_manager import get_manager, SAVE_DIR, EMBED_DIR, RESULTS_DIR
# import uvicorn
# from pathlib import Path
# import os

# app = FastAPI(title="Face-Pipeline API")

# # Allow Streamlit frontend local connections
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# manager = get_manager()

# @app.post("/pipeline/start")
# async def start_pipeline():
#     manager.start()
#     return {"status": "started", "process_status": manager.status()}

# @app.post("/pipeline/stop")
# async def stop_pipeline():
#     manager.stop()
#     return {"status": "stopped", "process_status": manager.status()}

# @app.get("/pipeline/status")
# async def pipeline_status():
#     return {"process_status": manager.status()}

# # # Upload a query image and run search
# # @app.post("/query")
# # async def query_image(file: UploadFile = File(...), topk: int = 5):
# #     # save uploaded file to a temporary location
# #     tmp_dir = Path("tmp_queries")
# #     tmp_dir.mkdir(exist_ok=True)
# #     filename = tmp_dir / file.filename
# #     with filename.open("wb") as f:
# #         shutil.copyfileobj(file.file, f)

# #     # run the matching using your search_query / face_recog_core
# #     try:
# #         # import inside handler to avoid heavy imports at server start
# #         import src.recognition.face_recog_core as frc
# #     except Exception:
# #         try:
# #             from src.recognition import face_recog_core as frc
# #         except Exception as e:
# #             raise HTTPException(status_code=500, detail=f"Could not import face_recog_core: {e}")

# #     try:
# #         pil = frc.read_image(str(filename))
# #         device = "cuda" if __import__("torch").cuda.is_available() else "cpu"
# #         model = frc.load_model(device=device)
# #         transform = frc.make_transform(160)
# #         qemb = frc.get_embedding_pytorch(pil, model, device, transform)
# #         # load index items and match
# #         items = frc.load_embeddings_index(embeddings_dir=str(EMBED_DIR))
# #         matches = frc.match_query(items, qemb, topk=topk, threshold=0.38)
# #         # create montage image bytes using annotate_and_save-like function if available
# #         try:
# #             import numpy as np, cv2
# #             q_bgr = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
# #             out_path = RESULTS_DIR / (filename.stem + "_matches.jpg")
# #             frc.annotate_and_save(q_bgr, dataset_dir=".", matches=matches, out_path=str(out_path))
# #             # return image bytes
# #             with open(out_path, "rb") as imgf:
# #                 b = imgf.read()
# #             return StreamingResponse(io.BytesIO(b), media_type="image/jpeg")
# #         except Exception as e:
# #             # fallback: return JSON with matches
# #             return JSONResponse({"matches": matches, "error_on_montage": str(e)})
# #     except Exception as e:
# #         raise HTTPException(status_code=500, detail=str(e))


# src/app.py
import io
import os
import shutil
import csv
import traceback
from pathlib import Path
from typing import List, Dict

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from src.pipeline_manager import get_manager, SAVE_DIR, EMBED_DIR, RESULTS_DIR

from PIL import Image, ImageDraw, ImageFont
import numpy as np

# --- Root / directories ---
# If this file is src/app.py, project root is parent of src
ROOT = Path(__file__).resolve().parent.parent
EMBED_DIR = ROOT / "embeddings"
#ALIGNED_DIR = ROOT / "aligned_faces"
SAVE_DIR = ROOT / ".save"
RESULTS_DIR = ROOT / "results"
TMP_QUERIES = ROOT / "tmp_queries"

for d in (EMBED_DIR,SAVE_DIR, RESULTS_DIR, TMP_QUERIES):
    d.mkdir(parents=True, exist_ok=True)

# --- Attempt to import pipeline manager (robust) ---
_pipeline_manager = None
try:
    # prefer import as package: src.pipeline_manager
    from src.pipeline_manager import get_manager as _get_manager
    _pipeline_manager = _get_manager()
except Exception:
    try:
        # fallback: pipeline_manager.py in project root
        from pipeline_manager import get_manager as _get_manager
        _pipeline_manager = _get_manager()
    except Exception:
        _pipeline_manager = None

# --- FastAPI app ---
app = FastAPI(title="Face Recognition Pipeline API")

# Allow Streamlit (and other frontends) to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Utility: load index CSV ---
def load_index(embeddings_dir: Path) -> List[Dict]:
    """
    Reads embeddings_index.csv and returns list of dicts:
      [{'image_file':str, 'embedding_file':str}, ...]
    """
    idx = []
    csvf = embeddings_dir / "embeddings_index.csv"
    if not csvf.exists():
        return idx
    try:
        with open(csvf, newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if len(row) >= 2:
                    idx.append({"image_file": row[0], "embedding_file": row[1]})
    except Exception:
        # fallback: return empty and let caller handle
        traceback.print_exc()
    return idx

# --- Utility: montage creator ---
def make_montage(query_pil: Image.Image, matched_items: List[Dict], thumb_h: int = 160, pad: int = 8) -> bytes:
    """
    Compose a horizontal montage: [query | match1 (label) | match2 (label) | ...]
    matched_items: list of dicts {'image_path': Path|None, 'image_file': str, 'dist': float}
    Returns JPEG bytes.
    """
    # font
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None

    q = query_pil.convert("RGB")
    wq, hq = q.size
    q_w = int(wq * (thumb_h / hq))
    q_thumb = q.resize((q_w, thumb_h), Image.LANCZOS)

    thumbs = [q_thumb]
    labels = ["QUERY"]
    for item in matched_items:
        img_path = item.get("image_path")
        label = item.get("image_file", "")
        dist = item.get("dist", 0.0)
        labels.append(f"{Path(label).stem}\n{dist:.3f}")
        if img_path and Path(img_path).exists():
            try:
                img = Image.open(img_path).convert("RGB")
                w, h = img.size
                tw = int(w * (thumb_h / h))
                thumb = img.resize((tw, thumb_h), Image.LANCZOS)
            except Exception:
                thumb = Image.new("RGB", (thumb_h, thumb_h), (120, 120, 120))
        else:
            # placeholder
            thumb = Image.new("RGB", (thumb_h, thumb_h), (60, 60, 60))
        thumbs.append(thumb)

    total_w = sum(im.size[0] for im in thumbs) + pad * (len(thumbs) + 1)
    total_h = thumb_h + 60  # space for labels

    montage = Image.new("RGB", (total_w, total_h), (20, 20, 20))
    x = pad
    draw = ImageDraw.Draw(montage)
    for im, lbl in zip(thumbs, labels):
        montage.paste(im, (x, pad))
        label_y = pad + im.size[1] + 6
        # multiline label
        try:
            draw.multiline_text((x, label_y), lbl, font=font, fill=(255, 255, 255))
        except Exception:
            draw.text((x, label_y), lbl.split("\n")[0], fill=(255,255,255))
        x += im.size[0] + pad

    bio = io.BytesIO()
    montage.save(bio, format="JPEG", quality=90)
    bio.seek(0)
    return bio.getvalue()

# --- Pipeline control endpoints ---
@app.post("/pipeline/start")
async def pipeline_start():
    if _pipeline_manager is None:
        return {"status": "error", "detail": "pipeline_manager not available (import failed)"}
    try:
        _pipeline_manager.start()
        return {"status": "started", "process_status": _pipeline_manager.status()}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pipeline/stop")
async def pipeline_stop():
    if _pipeline_manager is None:
        return {"status": "error", "detail": "pipeline_manager not available (import failed)"}
    try:
        _pipeline_manager.stop()
        return {"status": "stopped", "process_status": _pipeline_manager.status()}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pipeline/status")
async def pipeline_status():
    if _pipeline_manager is None:
        return {"process_status": {"detector": False, "extractor": False}, "note": "pipeline_manager unavailable"}
    return {"process_status": _pipeline_manager.status()}

# --- Query endpoint (upload file -> compute embedding -> match -> montage bytes) ---
@app.post("/query")
async def query_image(file: UploadFile = File(...), topk: int = Query(5, ge=1)):
    # Save uploaded query image
    tmp_dir = TMP_QUERIES
    tmp_dir.mkdir(exist_ok=True)
    filename = tmp_dir / file.filename
    try:
        with filename.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {e}")

    # Import face_recog_core lazily
    frc = None
    try:
        # prefer package import
        import importlib
        try:
            frc = importlib.import_module("src.recognition.face_recog_core")
        except Exception:
            try:
                frc = importlib.import_module("face_recog_core")
            except Exception:
                # last attempt: try src.face_recog_core
                try:
                    frc = importlib.import_module("src.face_recog_core")
                except Exception:
                    frc = None
    except Exception:
        frc = None

    if frc is None:
        raise HTTPException(status_code=500, detail="Could not import face_recog_core; ensure module is available and importable")

    try:
        # read query image (expects read_image returning PIL)
        pil = frc.read_image(str(filename))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to read uploaded image: {e}")

    try:
        device = "cuda" if __import__("torch").cuda.is_available() else "cpu"
    except Exception:
        device = "cpu"

    # load model & transform inside request (safe but might be slow)
    try:
        model = frc.load_model(device=device)
    except Exception:
        # If load_model signature differs, try calling without args
        try:
            model = frc.load_model()
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Failed to load recognition model: {e}")

    try:
        transform = frc.make_transform(160)
    except Exception:
        transform = None

    try:
        # compute query embedding (expects numpy array or torch tensor)
        qemb = frc.get_embedding_pytorch(pil, model, device, transform)
        if qemb is None:
            raise RuntimeError("get_embedding_pytorch returned None")
        # ensure numpy array
        qemb = np.asarray(qemb, dtype=np.float32)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to compute query embedding: {e}")

    # Load index CSV
    items = load_index(EMBED_DIR)
    if not items:
        # No indexed embeddings yet
        raise HTTPException(status_code=404, detail="No embeddings found in index (embeddings_index.csv missing or empty)")

    # Attempt to use frc.match_query if available
    matches = []
    try:
        if hasattr(frc, "match_query"):
            matches = frc.match_query(items, qemb, topk=topk, threshold=1.0)
            # normalize matches format to list of dicts with image_file and dist
            normalized = []
            for m in matches:
                # match_query may return different shapes; handle common keys
                if isinstance(m, dict):
                    normalized.append({"image_file": m.get("image_file") or m.get("img") or m.get("name", ""), "dist": float(m.get("dist", 0.0))})
                elif isinstance(m, (list, tuple)) and len(m) >= 2:
                    normalized.append({"image_file": m[0], "dist": float(m[1])})
                else:
                    # unknown shape; skip
                    continue
            matches = normalized[:topk]
    except Exception:
        # fallback to brute-force L2 on stored .npy embeddings
        traceback.print_exc()
        matches = []

    # If match_query did not produce results, brute-force compute L2 using .npy files
    if not matches:
        brute = []
        for it in items:
            emb_file = EMBED_DIR / it["embedding_file"]
            if not emb_file.exists():
                continue
            try:
                vec = np.load(str(emb_file))
                vec = np.asarray(vec, dtype=np.float32)
                dist = float(np.linalg.norm(qemb - vec))
                brute.append({"image_file": it["image_file"], "dist": dist, "embedding_file": it["embedding_file"]})
            except Exception:
                continue
        brute_sorted = sorted(brute, key=lambda x: x["dist"])[:topk]
        # reduce to expected format
        matches = [{"image_file": b["image_file"], "dist": float(b["dist"])} for b in brute_sorted]

    # Resolve each matched image to an actual path (try ALIGNED_DIR, SAVE_DIR, ROOT)
    lookup_dirs = [SAVE_DIR, ROOT]
    resolved = []
    for m in matches:
        img_name = m.get("image_file") or ""
        found = None
        for d in lookup_dirs:
            cand = d / img_name
            if cand.exists():
                found = cand
                break
        # try img_name as absolute/relative path
        if found is None:
            cand2 = Path(img_name)
            if cand2.exists():
                found = cand2
        resolved.append({"image_file": img_name, "image_path": found, "dist": float(m.get("dist", 0.0))})

    # Build montage
    try:
        montage_bytes = make_montage(pil, resolved)
        return StreamingResponse(io.BytesIO(montage_bytes), media_type="image/jpeg")
    except Exception as e:
        traceback.print_exc()
        # fallback JSON
        return JSONResponse({"matches": resolved, "error": f"montage_failed: {e}"})
