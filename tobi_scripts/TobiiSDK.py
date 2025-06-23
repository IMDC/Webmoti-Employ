#Reminder that Tobii_research requires a downgrade to Python 3.8
import tobii_research as tr
import mediapipe as mp
import numpy as np
import mss
import cv2
import time

mp_face_detection = mp.solutions.face_detection.FaceDetection(min_detection_confidence=0.7)
sct = mss.mss()
monitor = sct.monitors[1]

current_aoi_bbox = None

# Start Tobii
trackers = tr.find_all_eyetrackers()
if trackers:
    tracker = trackers[0]
    print("Connected to:", tracker.model)
else:
    print("No eye tracker found.")
    exit()

def get_screen_frame():
    img = np.array(sct.grab(monitor))
    img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    return img

def detect_interviewer(frame):
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = mp_face_detection.process(rgb_frame)
    if results.detections:
        return results.detections[0].location_data.relative_bounding_box
    return None

def gaze_callback(gaze_data):
    global current_aoi_bbox

    left_eye = gaze_data['left_gaze_point_on_display_area']
    right_eye = gaze_data['right_gaze_point_on_display_area']

    gaze_x, gaze_y = None, None

    if left_eye[0] and right_eye[0]:
        gaze_x = (left_eye[0] + right_eye[0]) / 2
        gaze_y = (left_eye[1] + right_eye[1]) / 2
    elif left_eye[0]:
        gaze_x, gaze_y = left_eye
    elif right_eye[0]:
        gaze_x, gaze_y = right_eye
    else:
        return

    if current_aoi_bbox:
        xmin, ymin, width, height = current_aoi_bbox.xmin, current_aoi_bbox.ymin, current_aoi_bbox.width, current_aoi_bbox.height
        if xmin <= gaze_x <= xmin + width and ymin <= gaze_y <= ymin + height:
            print("✅ Looking at interviewer.")
        else:
            print("⚠️ Looking away!")
    else:
        print("❗ No interviewer AOI found.")

tracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, gaze_callback, as_dictionary=True)

try:
    while True:
        frame = get_screen_frame()
        current_aoi_bbox = detect_interviewer(frame)

        if current_aoi_bbox:
            h, w, _ = frame.shape
            x, y, box_w, box_h = (int(current_aoi_bbox.xmin * w), int(current_aoi_bbox.ymin * h),
                                  int(current_aoi_bbox.width * w), int(current_aoi_bbox.height * h))
            cv2.rectangle(frame, (x, y), (x+box_w, y+box_h), (0,255,0), 2)

        cv2.imshow("Interviewer AOI Tracking", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

except KeyboardInterrupt:
    print("Stopped by user.")
finally:
    tracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, gaze_callback)
    cv2.destroyAllWindows()
