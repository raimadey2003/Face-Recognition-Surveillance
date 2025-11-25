"""
Face recognition using a pretrained PyTorch model (facenet-pytorch InceptionResnetV1).

Features:
- Uses `facenet-pytorch` InceptionResnetV1 pretrained on VGGFace2 (or CASIA) to compute face embeddings.
- Works with a dataset folder of cropped face images (one face per file).
- Precomputes embeddings and saves them to `embeddings/` as `.npy` with `embeddings_index.csv`.
- Computes embedding for a query image and returns top-K matches with cosine similarity.
- Supports GPU if available (use `--device cuda`), otherwise CPU.
- Keeps same CLI structure and behavior as previous scripts (dataset dir, precompute, query, --show_image).

Install requirements:
    pip install torch torchvision facenet-pytorch numpy opencv-python scikit-learn

Usage examples:
  # Precompute embeddings (use GPU if available):
  python face_recognition_pytorch.py --dataset_dir .save --precompute --device cuda

  # Query:
  python face_recognition_pytorch.py --dataset_dir .save --query query.jpg --topk 5 --device cuda --show_image

Notes:
- This assumes dataset images are face crops. If they're full images, you should run a face detector first.
- The facenet-pytorch model expects 160x160 RGB inputs.
"""

import os
import argparse
from pathlib import Path
import csv
import numpy as np
import cv2
from sklearn.metrics.pairwise import cosine_similarity

import torch
from facenet_pytorch import InceptionResnetV1
from PIL import Image
from torchvision import transforms


def ensure_dirs():
    os.makedirs('models', exist_ok=True)
    os.makedirs('embeddings', exist_ok=True)


# image loader -> PIL
def read_image(path):
    img = cv2.imread(str(path))
    if img is None:
        raise ValueError(f"Failed to read image: {path}")
    # OpenCV BGR -> RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return Image.fromarray(img)


# preprocessing: facenet default
def make_transform(input_size=160):
    return transforms.Compose([
        transforms.Resize((input_size, input_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
    ])


def load_model(device='cpu', pretrained='vggface2'):
    # pretrained choices: 'vggface2' or 'casia-webface'
    model = InceptionResnetV1(pretrained=pretrained).eval().to(device)
    return model


def get_embedding_pytorch(img_pil, model, device, transform):
    # img_pil: PIL image (RGB)
    x = transform(img_pil).unsqueeze(0).to(device)  # (1,3,H,W)
    with torch.no_grad():
        emb = model(x)  # (1,512)
    emb = emb.cpu().numpy().reshape(-1)
    # normalize
    n = np.linalg.norm(emb)
    if n > 0:
        emb = emb / n
    return emb.astype(np.float32)


def precompute_embeddings(dataset_dir, model, device, input_size=160, embeddings_dir='embeddings'):
    dataset_dir = Path(dataset_dir)
    embeddings_dir = Path(embeddings_dir)
    embeddings_dir.mkdir(parents=True, exist_ok=True)

    index_csv = embeddings_dir / 'embeddings_index.csv'
    rows = []

    transform = make_transform(input_size)

    image_paths = sorted([p for p in dataset_dir.iterdir() if p.is_file() and p.suffix.lower() in ['.jpg', '.jpeg', '.png']])
    print(f"Found {len(image_paths)} images in dataset_dir={dataset_dir}")

    for p in image_paths:
        try:
            img = read_image(p)
            emb = get_embedding_pytorch(img, model, device, transform)
            if emb is None:
                print(f"No embedding for {p}, skipping")
                continue
            emb_file = embeddings_dir / (p.stem + '.npy')
            np.save(str(emb_file), emb)
            rows.append([str(p.name), str(emb_file.name)])
            print(f"Saved embedding for {p.name} -> {emb_file.name}")
        except Exception as e:
            print(f"Error processing {p}: {e}")

    with open(index_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['image_file', 'embedding_file'])
        writer.writerows(rows)

    print(f"Precompute done. Index saved to {index_csv}")
    return index_csv


def load_embeddings_index(embeddings_dir='embeddings'):
    embeddings_dir = Path(embeddings_dir)
    index_csv = embeddings_dir / 'embeddings_index.csv'
    if not index_csv.exists():
        raise FileNotFoundError(f"Embeddings index not found at {index_csv}. Run with --precompute first or place .npy files and a csv index there.")
    items = []
    with open(index_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            img_file = r['image_file']
            emb_file = r['embedding_file']
            emb_path = embeddings_dir / emb_file
            if not emb_path.exists():
                print(f"Warning: embedding file {emb_path} missing for image {img_file}, skipping")
                continue
            emb = np.load(str(emb_path))
            n = np.linalg.norm(emb)
            if n > 0:
                emb = emb / n
            items.append({'image_file': img_file, 'embedding': emb})
    if len(items) == 0:
        raise RuntimeError("No embeddings loaded from index.")
    return items


def match_query(items, query_emb, topk=5, threshold=0.38):
    X = np.stack([it['embedding'] for it in items], axis=0)
    q = query_emb.reshape(1, -1)
    sims = cosine_similarity(q, X).reshape(-1)
    sims01 = (sims + 1.0) / 2.0
    idxs = np.argsort(-sims)[:topk]
    matches = []
    for i in idxs:
        if float(sims[i]) >= threshold:
            matches.append({'image_file': items[i]['image_file'], 'cosine': float(sims[i]), 'score01': float(sims01[i])})
    return matches


def annotate_and_save(query_bgr, dataset_dir, matches, out_path='result_matches.jpg'):
    thumbs = []
    font = cv2.FONT_HERSHEY_SIMPLEX
    hQ, wQ = query_bgr.shape[:2]
    max_h = 160
    scale = max_h / max(hQ, 1)
    q_thumb = cv2.resize(query_bgr, (int(wQ * scale), int(hQ * scale)))

    for m in matches:
        img_path = Path(dataset_dir) / m['image_file']
        im = cv2.imread(str(img_path))
        if im is None:
            im = np.zeros((int(max_h), int(max_h), 3), dtype=np.uint8)
        else:
            h, w = im.shape[:2]
            sc = max_h / max(h, 1)
            im = cv2.resize(im, (int(w * sc), int(h * sc)))
        text = f"{m['image_file']} {m['score01']:.3f}"
        cv2.putText(im, text, (5, im.shape[0] - 6), font, 0.4, (255, 255, 255), 1, cv2.LINE_AA)
        thumbs.append(im)

    spacer = 10
    total_w = q_thumb.shape[1] + spacer + sum(t.shape[1] + spacer for t in thumbs)
    final_h = max(q_thumb.shape[0], max((t.shape[0] for t in thumbs), default=0))
    canvas = np.zeros((final_h + 20, total_w + 20, 3), dtype=np.uint8)
    x = 10
    canvas[10:10 + q_thumb.shape[0], x:x + q_thumb.shape[1]] = q_thumb
    x += q_thumb.shape[1] + spacer
    for t in thumbs:
        canvas[10:10 + t.shape[0], x:x + t.shape[1]] = t
        x += t.shape[1] + spacer

    cv2.imwrite(out_path, canvas)
    return out_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dataset_dir', type=str, required=True, help='Directory with dataset face images (one face per file)')
    parser.add_argument('--query', type=str, default=None, help='Query image path')
    parser.add_argument('--precompute', action='store_true', help='Precompute embeddings for dataset and save to embeddings/')
    parser.add_argument('--topk', type=int, default=5)
    parser.add_argument('--input_size', type=int, default=160)
    parser.add_argument('--device', type=str, default='cuda', help="Device to run on: 'cuda' or 'cpu'")
    parser.add_argument('--pretrained', type=str, default='vggface2', help="facenet-pytorch pretrained weights: 'vggface2' or 'casia-webface'")
    parser.add_argument('--show_image', action='store_true', help='Save a result montage showing query and matches')
    args = parser.parse_args()

    ensure_dirs()

    device = args.device if torch.cuda.is_available() and args.device.startswith('cuda') else 'cpu'
    print('Using device:', device)

    model = load_model(device=device, pretrained=args.pretrained)
    transform = make_transform(args.input_size)

    if args.precompute:
        precompute_embeddings(args.dataset_dir, model, device, input_size=args.input_size, embeddings_dir='embeddings')
        return

    if args.query is None:
        print('No query image provided. Use --query path/to/image.jpg')
        return

    qimg_pil = read_image(args.query)
    qemb = get_embedding_pytorch(qimg_pil, model, device, transform)
    if qemb is None:
        print('No face embedding found in query image.')
        return

    items = load_embeddings_index(embeddings_dir='embeddings')
    matches = match_query(items, qemb, topk=args.topk)

    print('Top matches:')
    for m in matches:
        print(f"{m['image_file']}	cosine={m['cosine']:.4f}	score01={m['score01']:.4f}")

    if args.show_image:
        # create BGR query for saving
        q_bgr = cv2.cvtColor(np.array(qimg_pil), cv2.COLOR_RGB2BGR)
        out = annotate_and_save(q_bgr, args.dataset_dir, matches, out_path='result_matches.jpg')
        print(f"Saved result montage to {out}")


if __name__ == '__main__':
    main()
