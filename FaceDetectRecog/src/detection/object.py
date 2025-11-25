# src/detection/object.py

import cv2
from ultralytics import YOLO

class ObjectDetector:
    def __init__(self, model_path="yolov8n.pt", conf_thresh=0.5, img_size=640, device=None):
        """
        Args:
            model_path: YOLOv8 weights for general object detection or a custom 'threat' model.
        """
        self.model = YOLO(model_path)
        if device:
            self.model.to(device)
        self.conf_thresh = conf_thresh
        self.img_size = img_size

    def detect(self, frame):
        """
        Returns a list of (x1, y1, x2, y2, conf, class_id, class_name).
        """
        results = self.model(frame, imgsz=self.img_size, verbose=False)[0]
        detections = []
        for box in results.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = float(box.conf[0])
            cls  = int(box.cls[0])
            name = self.model.names[cls]
            if conf < self.conf_thresh:
                continue
            # Only keep person class to satisfy requirement
            if name == "person":
                detections.append((x1, y1, x2, y2, conf, cls, name))
        return detections

    @staticmethod
    def draw_detections(frame, detections):
        # Draw only person class to avoid clutter
        for x1, y1, x2, y2, conf, cls, name in detections:
            if name != "person":
                continue
            color = (255, 255, 0)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            label = f"person {conf:.2f}"
            (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(frame, (x1, y1), (x1 + w, y1 + h + 4), color, -1)
            cv2.putText(frame, label, (x1, y1 + h + 2),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
        return frame
