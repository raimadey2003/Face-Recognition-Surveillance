


# src/detection/face_yolo.py
import cv2
import torch
import os
import sys
from ultralytics import YOLO

class FaceDetector:
    """
    Implements face detection using the YOLOv8-Face model.
    This class is designed to be imported into other scripts.
    """
    def __init__(self, model_path="yolov8n-face.pt", conf_thresh=0.3, device=None):
        self.conf_thresh = conf_thresh
        self.device = device if device else ("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[INFO] Initializing YOLOv8-Face Detector on device: {self.device}")
        
        if not os.path.exists(model_path):
            print(f"[ERROR] Model file not found at: {model_path}", file=sys.stderr)
            sys.exit(1)
            
        self.model = YOLO(model_path)
        self.model.to(self.device)

    def detect(self, frame):
        """
        Runs YOLOv8-Face detection on the given BGR frame.
        
        Returns:
            A list of tuples, where each tuple contains:
            (x1, y1, x2, y2, confidence, landmarks_dict)
        """
        results = self.model(frame, verbose=True, imgsz=640)[0]
        
        detections = []
        boxes = results.boxes
        keypoints = results.keypoints

        # Iterate through each detected box
        for i in range(len(boxes)):
            box = boxes[i]
            conf = float(box.conf[0])

            if conf < self.conf_thresh:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            
            landmarks = {}
            # Safely check for corresponding keypoints
            if keypoints is not None and len(keypoints) > i:
                kpts = keypoints[i]
                if len(kpts.xy[0]) == 5:
                    lm_coords = kpts.xy[0].cpu().numpy().astype(int)
                    landmarks = {
                        'left_eye': tuple(lm_coords[0]),
                        'right_eye': tuple(lm_coords[1]),
                        'nose': tuple(lm_coords[2]),
                        'left_mouth': tuple(lm_coords[3]),
                        'right_mouth': tuple(lm_coords[4])
                    }
            
            # Append the detection
            detections.append((x1, y1, x2, y2, conf, landmarks))
                
        return detections
  


# # demo_face_detection.py
# import cv2
# import torch
# import os
# import sys
# import logging
# from datetime import datetime
# from ultralytics import YOLO

# def setup_logger():
#     """Configures a logger to save to a file and print to console."""
#     logger = logging.getLogger("FaceDetectionDemo")
#     logger.setLevel(logging.DEBUG)

#     if logger.hasHandlers():
#         return logger

#     log_dir = os.path.join("runs", "demo_logs")
#     os.makedirs(log_dir, exist_ok=True)
#     timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
#     log_file = os.path.join(log_dir, f"demo_{timestamp}.log")
#     file_handler = logging.FileHandler(log_file)
#     file_handler.setLevel(logging.DEBUG)

#     console_handler = logging.StreamHandler()
#     console_handler.setLevel(logging.INFO)

#     formatter = logging.Formatter(
#         '%(asctime)s - %(levelname)s - %(message)s',
#         datefmt='%Y-%m-%d %H:%M:%S'
#     )
#     file_handler.setFormatter(formatter)
#     console_handler.setFormatter(formatter)
#     logger.addHandler(file_handler)
#     logger.addHandler(console_handler)
#     return logger

# logger = setup_logger()

# class FaceDetector:
#     """
#     Implements face detection using the YOLOv8-Face model.
#     """
#     def __init__(self, model_path="yolov8n-face.pt", conf_thresh=0.5, device=None):
#         self.conf_thresh = conf_thresh
#         self.device = device if device else ("cuda" if torch.cuda.is_available() else "cpu")
#         logger.info(f"Initializing YOLOv8-Face Detector on device: {self.device}")
        
#         if not os.path.exists(model_path):
#             logger.error(f"Model file not found at: {model_path}")
#             sys.exit(1)
            
#         self.model = YOLO(model_path)
#         self.model.to(self.device)

#     def detect(self, frame):
#         """
#         Runs YOLOv8-Face detection on the given BGR frame. This version is more robust.
#         """
#         results = self.model(frame, verbose=False, imgsz=640)[0]
        
#         detections = []
#         boxes = results.boxes
#         keypoints = results.keypoints

#         logger.debug(f"Model raw output: {len(boxes)} boxes, "
#                      f"{len(keypoints) if keypoints is not None else 0} keypoints sets.")

#         # Iterate through each detected box
#         for i in range(len(boxes)):
#             box = boxes[i]
#             conf = float(box.conf[0])
            
#             logger.debug(f"  - Box {i+1}/{len(boxes)} confidence: {conf:.2f}")

#             if conf < self.conf_thresh:
#                 continue

#             x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            
#             landmarks = {}
#             # Safely check for corresponding keypoints
#             if keypoints is not None and len(keypoints) > i:
#                 kpts = keypoints[i]
#                 if len(kpts.xy[0]) == 5:
#                     lm_coords = kpts.xy[0].cpu().numpy().astype(int)
#                     landmarks = {
#                         'left_eye': tuple(lm_coords[0]),
#                         'right_eye': tuple(lm_coords[1]),
#                         'nose': tuple(lm_coords[2]),
#                         'left_mouth': tuple(lm_coords[3]),
#                         'right_mouth': tuple(lm_coords[4])
#                     }
            
#             # Append the detection even if landmarks are missing
#             detections.append((x1, y1, x2, y2, conf, landmarks))
                
#         return detections

#     @staticmethod
#     def draw_detections(frame, detections):
#         """Draws bounding boxes and landmarks on the frame."""
#         COLOR_BOX = (255, 0, 0) # Blue for box
#         COLOR_LM = (0, 255, 255) # Yellow for landmarks
#         for det in detections:
#             x1, y1, x2, y2, conf, landmarks = det
#             cv2.rectangle(frame, (x1, y1), (x2, y2), COLOR_BOX, 2)
            
#             label = f"{conf:.2f}"
#             (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
#             cv2.rectangle(frame, (x1, y1 - h - 5), (x1 + w, y1), COLOR_BOX, -1)
#             cv2.putText(frame, label, (x1, y1 - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

#             # Only draw landmarks if the dictionary is not empty
#             if landmarks:
#                 for lm_coords in landmarks.values():
#                     cv2.circle(frame, lm_coords, 3, COLOR_LM, -1)
#         return frame

# def run_demo():
#     """Main function to run the face detection demo."""
#     logger.info("Starting face detection demo...")
    
#     # --- CHANGE: Lowered confidence threshold for better initial testing ---
#     detector = FaceDetector(model_path="yolov8n-face.pt", conf_thresh=0.3)

#     cap = cv2.VideoCapture(0)
#     if not cap.isOpened():
#         logger.error("Could not open webcam.")
#         return

#     cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
#     cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
#     logger.info("Webcam opened successfully.")
    
#     frame_count = 0
#     try:
#         while True:
#             ret, frame = cap.read()
#             if not ret:
#                 logger.info("End of video stream.")
#                 break
            
#             frame_count += 1
            
#             detections = detector.detect(frame)
#             logger.debug(f"Frame {frame_count}: Found {len(detections)} faces.")
            
#             frame_with_detections = FaceDetector.draw_detections(frame.copy(), detections)

#             cv2.imshow("YOLOv8 Face Detection Demo", frame_with_detections)

#             if cv2.waitKey(1) & 0xFF == ord('q'):
#                 logger.info("'q' key pressed, exiting.")
#                 break
#     finally:
#         logger.info("Shutting down demo.")
#         cap.release()
#         cv2.destroyAllWindows()

# if __name__ == "__main__":
#     run_demo()