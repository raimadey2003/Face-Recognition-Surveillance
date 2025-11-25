import cv2
import numpy as np
import torch
from retinaface import RetinaFace
import time

class FaceDetector:
    """
    Enhanced RetinaFace-based Face Detector.
    Includes:
    - Face alignment (via 5-point landmarks)
    - Optional cropped face returns
    - FPS overlay for live stream
    - Robust exception handling
    """
    def __init__(self, device=None, conf_thresh=0.9):
        self.conf_thresh = conf_thresh
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"[INFO] Initializing RetinaFace Detector | Device: {self.device} | Conf: {conf_thresh}")

    def detect(self, frame, return_faces=False, align_faces=True):
        """
        Detects faces in the given frame.

        Args:
            frame (np.ndarray): BGR frame.
            return_faces (bool): If True, return cropped/aligned faces.
            align_faces (bool): Align faces using 5-point landmarks.

        Returns:
            detections (list): [(x1, y1, x2, y2, conf), ...]
            faces (list): [cropped_face1, cropped_face2, ...] if return_faces=True
        """
        if frame is None or not isinstance(frame, np.ndarray):
            print("[WARN] Invalid frame passed to detector.")
            return [] if not return_faces else ([], [])

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        try:
            results = RetinaFace.detect_faces(rgb)
        except Exception as e:
            print(f"[ERROR] RetinaFace detection failed: {e}")
            return [] if not return_faces else ([], [])

        detections, faces = [], []
        if isinstance(results, dict):
            for _, det in results.items():
                score = det.get('score', 0)
                if score < self.conf_thresh:
                    continue

                x1, y1, x2, y2 = map(int, det['facial_area'])
                detections.append((x1, y1, x2, y2, float(score)))

                if return_faces:
                    landmarks = det.get('landmarks', None)
                    face_crop = self._extract_face(frame, (x1, y1, x2, y2), landmarks, align_faces)
                    if face_crop is not None:
                        faces.append(face_crop)

        if return_faces:
            return detections, faces
        return detections, []

    def _extract_face(self, frame, box, landmarks=None, align=True):
        """Crop and optionally align face using eye landmarks."""
        x1, y1, x2, y2 = box
        face = frame[y1:y2, x1:x2]
        if face.size == 0:
            return None

        if align and landmarks:
            left_eye = landmarks.get('left_eye')
            right_eye = landmarks.get('right_eye')
            if left_eye and right_eye:
                face = self._align_face(frame, (x1, y1, x2, y2), left_eye, right_eye)
        return face

    def _align_face(self, frame, box, left_eye, right_eye):
        """Aligns face horizontally based on eye coordinates."""
        x1, y1, x2, y2 = box
        face = frame[y1:y2, x1:x2]

        dx = right_eye[0] - left_eye[0]
        dy = right_eye[1] - left_eye[1]
        angle = np.degrees(np.arctan2(dy, dx))
        M = cv2.getRotationMatrix2D(center=left_eye, angle=angle, scale=1)
        aligned = cv2.warpAffine(frame, M, (frame.shape[1], frame.shape[0]))
        return aligned[y1:y2, x1:x2]

    @staticmethod
    def draw_detections(frame, detections, fps=None):
        """Draw bounding boxes, confidence, and FPS on the frame."""
        COLOR = (0, 255, 0)
        for i, (x1, y1, x2, y2, conf) in enumerate(detections, start=1):
            cv2.rectangle(frame, (x1, y1), (x2, y2), COLOR, 2)
            label = f"Face {i}: {conf:.2f}"
            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, COLOR, 2)

        if fps:
            cv2.putText(frame, f"FPS: {fps:.2f}", (10, 25),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
        return frame


if __name__ == "__main__":
    detector = FaceDetector(conf_thresh=0.85)
    cap = cv2.VideoCapture(0)

    process_every_n_frames = 10  # detect every 5th frame
    prev_detections = []
    prev_time = time.time()
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1

        # ↓↓↓ Downscale for faster inference ↓↓↓
        small_frame = cv2.resize(frame, (640, 360))
        scale_x = frame.shape[1] / 640
        scale_y = frame.shape[0] / 360

        # Run detector only on every Nth frame
        if frame_count % process_every_n_frames == 0:
            detections, _ = detector.detect(small_frame, return_faces=False)
            prev_detections = [
                (int(x1*scale_x), int(y1*scale_y), int(x2*scale_x), int(y2*scale_y), conf)
                for (x1, y1, x2, y2, conf) in detections
            ]

        curr_time = time.time()
        fps = 1.0 / (curr_time - prev_time)
        prev_time = curr_time

        frame = FaceDetector.draw_detections(frame, prev_detections, fps)
        cv2.imshow("Fast RetinaFace Detector", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
