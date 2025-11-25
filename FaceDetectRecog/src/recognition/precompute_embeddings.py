# precompute_embeddings.py
import argparse
import torch
from src.recognition.face_recog_core import precompute_embeddings,ensure_dirs, load_model, make_transform, read_image, get_embedding_pytorch, load_embeddings_index, match_query, annotate_and_save


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dataset_dir', type=str, required=True, help='Directory with dataset face images (one face per file)')
    #parser.add_argument('--query', type=str, default=None, help='Query image path')
    parser.add_argument('--precompute', action='store_true', help='Precompute embeddings for dataset and save to embeddings/')
    #parser.add_argument('--topk', type=int, default=5)
    parser.add_argument('--input_size', type=int, default=160)
    parser.add_argument('--device', type=str, default='cuda', help="Device to run on: 'cuda' or 'cpu'")
    parser.add_argument('--pretrained', type=str, default='vggface2', help="facenet-pytorch pretrained weights: 'vggface2' or 'casia-webface'")
    #parser.add_argument('--show_image', action='store_true', help='Save a result montage showing query and matches')
    args = parser.parse_args()

    ensure_dirs()

    device = args.device if torch.cuda.is_available() and args.device.startswith('cuda') else 'cpu'
    print('Using device:', device)

    model = load_model(device=device, pretrained=args.pretrained)
    #transform = make_transform(args.input_size)

    if args.precompute:
        precompute_embeddings(args.dataset_dir, model, device, input_size=args.input_size, embeddings_dir='embeddings')
        return


    


if __name__ == '__main__':
    main()
