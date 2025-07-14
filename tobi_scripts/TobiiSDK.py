# Ensure Python 3.8 compatibility
import tobii_research as tr
import mediapipe as mp
import numpy as np
import mss
import cv2
import time
import csv
from collections import deque
import math
import random


# Test Mode Configuration
TEST_MODE = False  # Auto-set later if no tracker is found

# Eye movement classification setup
gaze_history = deque(maxlen=5)
FIXATION_VELOCITY_THRESHOLD = 100  # pixels per second

def classify_eye_movement(new_point, timestamp):
    gaze_history.append((timestamp, new_point))
    if len(gaze_history) < 2:
        return "Unknown"
    (t1, (x1, y1)), (t2, (x2, y2)) = gaze_history[-2], gaze_history[-1]
    if None in [x1, y1, x2, y2] or t1 == t2:
        return "Unknown"
    dist = math.hypot(x2 - x1, y2 - y1)
    delta_t = (t2 - t1) / 1e6  # microseconds to seconds
    if delta_t == 0:
        return "Unknown"
    velocity = dist / delta_t
    return "Fixation" if velocity < FIXATION_VELOCITY_THRESHOLD else "Saccade"

# Setup
mp_face_detection = mp.solutions.face_detection.FaceDetection(min_detection_confidence=0.7)
sct = mss.mss()
monitor = sct.monitors[1]
current_aoi_bbox = None
start_timestamp = None

# CSV setup
csv_file = open('gaze_data.csv', mode='w', newline='')
csv_writer = csv.writer(csv_file)
csv_writer.writerow([
    'Elapsed_Time_s', 'Gaze_X_Left', 'Gaze_Y_Left', 'Gaze_X_Right', 'Gaze_Y_Right',
    'Gaze_X_Average', 'Gaze_Y_Average', 'Pupil_Diameter_Left', 'Pupil_Diameter_Right',
    'Validity_Left', 'Validity_Right', 'Looking_At_Interviewer', 'Eye_Movement_Type'
])

# Connect to Tobii
trackers = tr.find_all_eyetrackers()
if trackers:
    tracker = trackers[0]
    print("Connected to:", tracker.model)
else:
    print("⚠️ No eye tracker found. Running in TEST MODE.")
    TEST_MODE = True


# Screen and AOI functions
def get_screen_frame():
    img = np.array(sct.grab(monitor))
    return cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

def detect_interviewer(frame):
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = mp_face_detection.process(rgb_frame)
    if results.detections:
        return results.detections[0].location_data.relative_bounding_box
    return None

# Real or Simulated Gaze Callback
def handle_gaze_data(timestamp, gaze_x_left, gaze_y_left, gaze_x_right, gaze_y_right,
                     pupil_left, pupil_right, validity_left, validity_right):
    global current_aoi_bbox, start_timestamp

    # Check for valid gaze points explicitly
    if not (validity_left and validity_right):
        return  # Immediately skip if data is invalid

    if start_timestamp is None:
        start_timestamp = timestamp
    elapsed_seconds = (timestamp - start_timestamp) / 1e6

    gaze_coords_x = [x for x in [gaze_x_left, gaze_x_right] if x is not None]
    gaze_coords_y = [y for y in [gaze_y_left, gaze_y_right] if y is not None]

    # If averages can't be calculated, skip recording
    if not gaze_coords_x or not gaze_coords_y:
        return

    gaze_x_avg = np.mean(gaze_coords_x)
    gaze_y_avg = np.mean(gaze_coords_y)

    looking_at_interviewer = False
    if current_aoi_bbox:
        xmin, ymin, width, height = (
            current_aoi_bbox.xmin, current_aoi_bbox.ymin,
            current_aoi_bbox.width, current_aoi_bbox.height
        )
        looking_at_interviewer = (xmin <= gaze_x_avg <= xmin + width and
                                  ymin <= gaze_y_avg <= ymin + height)

    movement_type = classify_eye_movement((gaze_x_avg, gaze_y_avg), timestamp)

    # Now write only valid data points to CSV
    csv_writer.writerow([
        f"{elapsed_seconds:.3f}", gaze_x_left, gaze_y_left, gaze_x_right, gaze_y_right,
        gaze_x_avg, gaze_y_avg, pupil_left, pupil_right,
        validity_left, validity_right, looking_at_interviewer, movement_type
    ])

    print(f"{elapsed_seconds:.2f}s {'✅' if looking_at_interviewer else '⚠️'} | Movement: {movement_type}")

# Tobii Callback Function
def gaze_callback(gaze_data):
    timestamp = gaze_data['device_time_stamp']
    left_eye = gaze_data['left_gaze_point_on_display_area']
    right_eye = gaze_data['right_gaze_point_on_display_area']
    pupil_left = gaze_data['left_pupil_diameter']
    pupil_right = gaze_data['right_pupil_diameter']
    validity_left = gaze_data['left_gaze_point_validity']
    validity_right = gaze_data['right_gaze_point_validity']

    gaze_x_left, gaze_y_left = left_eye
    gaze_x_right, gaze_y_right = right_eye

    handle_gaze_data(timestamp, gaze_x_left, gaze_y_left, gaze_x_right, gaze_y_right,
                     pupil_left, pupil_right, validity_left, validity_right)

# Main Loop
if not TEST_MODE:
    tracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, gaze_callback, as_dictionary=True)

try:
    while True:
        frame = get_screen_frame()
        current_aoi_bbox = detect_interviewer(frame)

        if current_aoi_bbox:
            h, w, _ = frame.shape
            x, y, box_w, box_h = (int(current_aoi_bbox.xmin * w), int(current_aoi_bbox.ymin * h),
                                  int(current_aoi_bbox.width * w), int(current_aoi_bbox.height * h))
            cv2.rectangle(frame, (x, y), (x + box_w, y + box_h), (0, 255, 0), 2)

        if TEST_MODE:
            timestamp = int(time.time() * 1e6)
            gaze_x_left = random.uniform(0.3, 0.7)
            gaze_y_left = random.uniform(0.3, 0.7)
            gaze_x_right = random.uniform(0.3, 0.7)
            gaze_y_right = random.uniform(0.3, 0.7)
            pupil_left = random.uniform(2.5, 3.5)
            pupil_right = random.uniform(2.5, 3.5)
            validity_left = 1
            validity_right = 1
            handle_gaze_data(timestamp, gaze_x_left, gaze_y_left, gaze_x_right, gaze_y_right,
                             pupil_left, pupil_right, validity_left, validity_right)

        cv2.imshow("Interviewer AOI Tracking", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

except KeyboardInterrupt:
    print("Stopped by user.")

finally:
    if not TEST_MODE:
        tracker.unsubscribe_from(tr.EYETRACKER_GAZE_DATA, gaze_callback)
    csv_file.close()
    cv2.destroyAllWindows()
