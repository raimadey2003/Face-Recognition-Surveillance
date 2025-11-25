"""
align_py312.py

Robust face alignment for Python 3.12+ using:
  - primary landmark detector: face_alignment (1adrianb / FAN) -> 68 points
  - fallback: facenet-pytorch MTCNN alignment
Outputs aligned crops to aligned_faces/

Requirements (try installing these; see notes below if installs fail on 3.12):
    pip install face-alignment facenet-pytorch opencv-python pillow numpy scipy torch torchvision

Usage:
    python align_py312.py
"""

import os
import sys
import cv2
import numpy as np
from PIL import Image

# try to import face_alignment and detect if available
try:
    import face_alignment
    FA_AVAILABLE = True
except Exception as e:
    print("[INFO] face_alignment import failed:", e)
    FA_AVAILABLE = False

# import facenet-pytorch MTCNN as fallback (should work on 3.12 if torch wheel is available)
try:
    from facenet_pytorch import MTCNN
    MTCNN_AVAILABLE = True
except Exception as e:
    print("[INFO] facenet-pytorch import failed:", e)
    MTCNN_AVAILABLE = False

# ---------- CONFIG ----------
SRC_DIR = ".save/"
OUT_DIR = "aligned_faces/"
TARGET_SIZE = (160, 160)   # change to (112,112) if using ArcFace
USE_ADVANCED_5PT = True    # include mouth corners + chin for more robust fit
os.makedirs(OUT_DIR, exist_ok=True)

# setup MTCNN fallback if available
if MTCNN_AVAILABLE:
    mtcnn = MTCNN(image_size=TARGET_SIZE[0], margin=0)

# setup face_alignment if available; choose torch device safely
if FA_AVAILABLE:
    # pick device via torch if available, otherwise CPU
    try:
        import torch
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
    except Exception:
        device = 'cpu'
    try:
        fa = face_alignment.FaceAlignment(face_alignment.LandmarksType._2D, flip_input=False, device=device)
    except Exception as e:
        print("[WARN] face_alignment.FaceAlignment construction failed:", e)
        fa = None
        FA_AVAILABLE = False

# ---------- helpers ----------

def read_image_bgr(path):
    img = cv2.imread(path)
    return img

def compute_feature_centers(landmarks_68):
    """
    landmarks_68: (68,2) array
    returns dict of robust keypoints
    """
    L = {}
    L['left_eye']   = landmarks_68[36:42].mean(axis=0)    # 36-41
    L['right_eye']  = landmarks_68[42:48].mean(axis=0)    # 42-47
    L['nose']       = landmarks_68[27:36].mean(axis=0)    # 27-35
    L['left_mouth'] = landmarks_68[48]                   # 48
    L['right_mouth']= landmarks_68[54]                   # 54
    L['chin']       = landmarks_68[8]                    # 8
    return L

def make_target_points(sz):
    w, h = sz
    tgt = {}
    tgt['left_eye']   = np.array([0.30 * w, 0.36 * h], dtype=np.float32)
    tgt['right_eye']  = np.array([0.70 * w, 0.36 * h], dtype=np.float32)
    tgt['nose']       = np.array([0.50 * w, 0.52 * h], dtype=np.float32)
    tgt['left_mouth'] = np.array([0.37 * w, 0.72 * h], dtype=np.float32)
    tgt['right_mouth']= np.array([0.63 * w, 0.72 * h], dtype=np.float32)
    tgt['chin']       = np.array([0.50 * w, 0.90 * h], dtype=np.float32)
    return tgt

def estimate_and_warp(img_bgr, src_pts, dst_pts, output_size=TARGET_SIZE):
    src = np.array(src_pts, dtype=np.float32)
    dst = np.array(dst_pts, dtype=np.float32)
    if src.shape[0] < 3:
        return None
    M, inliers = cv2.estimateAffinePartial2D(src, dst, method=cv2.LMEDS)
    if M is None:
        M, inliers = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC)
    if M is None:
        return None
    warped = cv2.warpAffine(img_bgr, M, output_size, flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    return warped

def center_crop_resize(pil_img, size):
    w, h = pil_img.size
    target_w, target_h = size
    min_side = min(w, h)
    left = (w - min_side) // 2
    top  = (h - min_side) // 2
    pil_crop = pil_img.crop((left, top, left+min_side, top+min_side))
    pil_crop = pil_crop.resize(size, Image.BICUBIC)
    return pil_crop

# ---------- main align function ----------

def align_image(input_path, out_path, target_size=TARGET_SIZE, use_5pt=USE_ADVANCED_5PT):
    img_bgr = read_image_bgr(input_path)
    if img_bgr is None:
        print(f"[ERROR] cannot read {input_path}")
        return False
    h, w = img_bgr.shape[:2]

    # 1) try face_alignment (FAN / 68 points)
    if FA_AVAILABLE and fa is not None:
        try:
            # get_landmarks_from_image returns list of arrays or None
            preds = fa.get_landmarks_from_image(img_bgr)
        except Exception as e:
            print("[WARN] face_alignment detection error:", e)
            preds = None

        if preds and len(preds) > 0:
            lm = preds[0]  # first face
            centers = compute_feature_centers(lm)
            tgt = make_target_points(target_size)

            src_pts = []
            dst_pts = []

            # always include eyes + nose
            src_pts.append(centers['left_eye']); dst_pts.append(tgt['left_eye'])
            src_pts.append(centers['right_eye']); dst_pts.append(tgt['right_eye'])
            src_pts.append(centers['nose']); dst_pts.append(tgt['nose'])

            if use_5pt:
                src_pts.append(centers['left_mouth']); dst_pts.append(tgt['left_mouth'])
                src_pts.append(centers['right_mouth']); dst_pts.append(tgt['right_mouth'])
                src_pts.append(centers['chin']); dst_pts.append(tgt['chin'])

            warped = estimate_and_warp(img_bgr, src_pts, dst_pts, output_size=target_size)
            if warped is not None:
                cv2.imwrite(out_path, warped)
                return True
            else:
                print("[WARN] affine estimation failed -> fallback to MTCNN/center-crop")

    # 2) fallback: MTCNN (if available)
    if MTCNN_AVAILABLE:
        try:
            pil = Image.open(input_path).convert('RGB')
            face = mtcnn(pil)  # returns aligned torch tensor or None
            if face is not None:
                arr = (face.permute(1,2,0).numpy() * 255).astype(np.uint8)
                Image.fromarray(arr).save(out_path)
                return True
            else:
                print("[WARN] MTCNN did not find a face; falling back to center crop")
        except Exception as e:
            print("[WARN] MTCNN fallback error:", e)

    # 3) final fallback: center crop & resize
    try:
        pil = Image.open(input_path).convert('RGB')
        pil2 = center_crop_resize(pil, target_size)
        pil2.save(out_path)
        return True
    except Exception as e:
        print("[ERROR] final fallback failed:", e)
        return False

# ---------- batch runner ----------
def process_directory(src_dir=SRC_DIR, out_dir=OUT_DIR):
    files = sorted([f for f in os.listdir(src_dir) if f.lower().endswith(('.jpg','.jpeg','.png'))])
    print(f"[INFO] Found {len(files)} files in {src_dir}. Writing aligned crops to {out_dir}.")
    for fn in files:
        in_path = os.path.join(src_dir, fn)
        out_path = os.path.join(out_dir, fn)
        ok = align_image(in_path, out_path)
        print(f"{fn} -> {'OK' if ok else 'FAILED'}")

if __name__ == "__main__":
    process_directory()
