# # test.py
import cv2
import torch
import os
import sys
import logging
from datetime import datetime
from src.detection.face2 import FaceDetector
from src.tracking.deep_sort import Tracker

def setup_logger():
    """Configures a logger to save to a file and print to console."""
    logger = logging.getLogger("FaceTrackingTest")
    logger.setLevel(logging.DEBUG)

    if logger.hasHandlers():
        return logger

    log_dir = os.path.join("runs", "test_logs")
    os.makedirs(log_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(log_dir, f"test_{timestamp}.log")
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.DEBUG)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    return logger

logger = setup_logger()

# Create cache directory for saved face crops
SAVE_DIR = ".save"
os.makedirs(SAVE_DIR, exist_ok=True)

def run_test():
    """Main function to run the face detection and tracking test."""
    logger.info("Starting face detection and tracking test...")
    
    detector = FaceDetector(model_path="yolov8n-face.pt", conf_thresh=0.3)
    tracker = Tracker(max_age=30, n_init=3, max_iou_distance=0.7)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        logger.error("Could not open webcam.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    logger.info("Webcam opened successfully.")
    
    frame_count = 0
    # Track last save time per track to avoid duplicates
    last_saved = {}

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                logger.info("End of video stream.")
                break
            
            frame_count += 1
            
            # 1. Detect faces with landmarks
            detections_with_landmarks = detector.detect(frame)
            
            # Prepare detections for the tracker ((x1, y1, x2, y2, conf))
            tracker_detections = [(d[0], d[1], d[2], d[3], d[4]) for d in detections_with_landmarks]
            
            # 2. Update tracker
            tracks = tracker.update(tracker_detections, frame)
            
            # --- FIX: Log detailed track info safely ---
            if tracks:
                logger.debug(f"Frame {frame_count}: Confirmed tracks: {len(tracks)}")
                for track in tracks:
                    conf = track.get('confidence')
                    conf_str = f"{conf:.2f}" if conf is not None else "N/A"
                    logger.debug(f"  -> Track ID: {track['track_id']}, "
                                 f"Confidence: {conf_str}, "
                                 f"BBox: {track['bbox']}")
            else:
                logger.debug(f"Frame {frame_count}: No confirmed tracks.")


            # 3. Draw the tracks, landmarks, and confidence scores
            for track in tracks:
                track_id = track['track_id']
                x1, y1, x2, y2 = track['bbox']
                conf = track.get('confidence')

                # Draw bounding box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                
                # Prepare label with Face ID and Confidence
                label = f"ID: {track_id}"
                if conf is not None:
                    label += f" ({conf:.2f})"
                (w_text, h_text), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                cv2.rectangle(frame, (x1, y1 - h_text - 10), (x1 + w_text, y1), (0, 255, 0), -1)
                cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

                # Save cropped face image in id_timestamp format, rate-limited per track
                h, w = frame.shape[:2]
                x1c = max(0, x1); y1c = max(0, y1); x2c = min(w - 1, x2); y2c = min(h - 1, y2)
                if x2c > x1c and y2c > y1c:
                    face_crop = frame[y1c:y2c, x1c:x2c]
                    now = datetime.now()
                    last_time = last_saved.get(track_id)
                    if (last_time is None) or ((now - last_time).total_seconds() >= 1.0):
                        timestamp = now.strftime('%Y%m%d_%H%M%S')
                        filename = f"{track_id}_{timestamp}.jpg"
                        filepath = os.path.join(SAVE_DIR, filename)
                        try:
                            cv2.imwrite(filepath, face_crop)
                            last_saved[track_id] = now
                            logger.debug(f"Saved face crop: {filepath}")
                        except Exception as e:
                            logger.error(f"Failed to save face crop for track {track_id}: {e}")

                # Find and draw landmarks
                for det in detections_with_landmarks:
                    dx1, dy1, _, _, _, landmarks = det
                    if abs(x1 - dx1) < 5 and abs(y1 - dy1) < 5:
                         if landmarks:
                            for lm_coords in landmarks.values():
                                cv2.circle(frame, lm_coords, 3, (0, 255, 255), -1)
                         break

            cv2.imshow("Face Tracking Test", frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                logger.info("'q' key pressed, exiting.")
                break
    finally:
        logger.info("Shutting down test.")
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    run_test()

