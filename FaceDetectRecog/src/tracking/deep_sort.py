# src/tracking/deep_sort.py

from deep_sort_realtime.deepsort_tracker import DeepSort

class Tracker:
    def __init__(self, max_age=100, n_init=3, max_iou_distance=0.7):
        """
        Args:
            max_age: how long to keep “lost” tracks
            n_init: frames before confirming a track
            max_iou_distance: gating threshold for Kalman updates
        """
        self.tracker = DeepSort(
            max_age=max_age,
            n_init=n_init,
            max_iou_distance=max_iou_distance
        )

    def update(self, detections, frame):
        """
        Args:
            detections: list of (x1, y1, x2, y2, confidence)
            frame: full BGR frame (for appearance features)
        Returns:
            List of dicts: {'track_id', 'bbox':(x1,y1,x2,y2), 'confidence'}
        """
        raw_detections = []
        for x1, y1, x2, y2, conf in detections:
            w = x2 - x1
            h = y2 - y1
            # Format: ([x, y, w, h], confidence, class_id)
            raw_detections.append(([x1, y1, w, h], conf, 0))

        tracks = self.tracker.update_tracks(raw_detections, frame=frame)
        outputs = []
        for t in tracks:
            if not t.is_confirmed():
                continue
            # t.to_tlbr() returns (xmin, ymin, xmax, ymax)
            x1, y1, x2, y2 = t.to_tlbr()
            outputs.append({
                'track_id': t.track_id,
                'bbox': (int(x1), int(y1), int(x2), int(y2)),
                'confidence': t.det_conf
            })
        return outputs