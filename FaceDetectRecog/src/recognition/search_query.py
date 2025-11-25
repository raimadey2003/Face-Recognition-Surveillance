# search_query.py
import argparse
import torch
import numpy as np
import cv2
from src.recognition.face_recog_core import ensure_dirs, load_model, make_transform, read_image, get_embedding_pytorch, load_embeddings_index, match_query, annotate_and_save

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dataset_dir', type=str, required=True, help='Directory with dataset face images (one face per file)')
    parser.add_argument('--query', type=str, required=True, help='Query image path')
    parser.add_argument('--topk', type=int, default=5)
    parser.add_argument('--input_size', type=int, default=160)
    parser.add_argument('--device', type=str, default='cuda', help="cuda or cpu")
    parser.add_argument('--pretrained', type=str, default='vggface2')
    parser.add_argument('--threshold', type=float, default=0.38, help='cosine threshold (raw cosine, -1..1)')
    parser.add_argument('--show_image', action='store_true', help='Save a result montage showing query and matches')
    parser.add_argument('--out', type=str, default='result_matches.jpg', help='Output montage path')
    args = parser.parse_args()

    ensure_dirs()
    device = args.device if torch.cuda.is_available() and args.device.startswith('cuda') else 'cpu'
    print('Using device:', device)

    # Load model & transform to compute query embedding
    model = load_model(device=device, pretrained=args.pretrained)
    transform = make_transform(args.input_size)

    # Read query and compute embedding
    qimg_pil = read_image(args.query)
    qemb = get_embedding_pytorch(qimg_pil, model, device, transform)
    if qemb is None:
        print('No face embedding found in query image.')
        return

    # Load precomputed items
    items = load_embeddings_index(embeddings_dir='embeddings')
    matches = match_query(items, qemb, topk=args.topk, threshold=args.threshold)

    print('Top matches:')
    for m in matches:
        print(f"{m['image_file']}\tcosine={m['cosine']:.4f}\tscore01={m['score01']:.4f}")

    if args.show_image:
        # create BGR query for saving
        q_bgr = cv2.cvtColor(np.array(qimg_pil), cv2.COLOR_RGB2BGR)
        out = annotate_and_save(q_bgr, args.dataset_dir, matches, out_path=args.out)
        print(f"Saved result montage to {out}")

if __name__ == '__main__':
    main()
