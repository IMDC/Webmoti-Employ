import asyncio
import math
import random
import time
from collections import deque
from typing import Literal, TypedDict, Any
import tobii_research as tr
import socketio
from aiohttp import web
from loguru import logger

# Setup Socket.IO Server
sio = socketio.AsyncServer(cors_allowed_origins="*")
app = web.Application()
sio.attach(app)

# Global state
current_aoi_bbox = None
start_timestamp = None
TEST_MODE = False  # Auto-set if no tracker

# Eye movement classification setup
gaze_history = deque(maxlen=5)
FIXATION_VELOCITY_THRESHOLD = 100  # pixels per second
MIN_GAZE_POINTS = 2

# AOI data structure from Electron
class AOIBoundingBox(TypedDict):
    x: float
    y: float
    width: float
    height: float

def classify_eye_movement(
    new_point: tuple[float, float],
    timestamp: int,
) -> Literal["Unknown", "Fixation", "Saccade"]:
    """Classify eye movement as fixation or saccade."""
    gaze_history.append((timestamp, new_point))
    if len(gaze_history) < MIN_GAZE_POINTS:
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

# Tobii gaze data format
class GazeData(TypedDict):
    device_time_stamp: int
    left_gaze_point_on_display_area: tuple[float, float]
    right_gaze_point_on_display_area: tuple[float, float]
    left_pupil_diameter: float
    right_pupil_diameter: float
    left_gaze_point_validity: int
    right_gaze_point_validity: int

async def handle_gaze_data(
    timestamp: int,
    gaze_x_left: float,
    gaze_y_left: float,
    gaze_x_right: float,
    gaze_y_right: float,
    pupil_left: float,
    pupil_right: float,
    validity_left: int,
    validity_right: int,
) -> None:
    global current_aoi_bbox, start_timestamp

    if not (validity_left and validity_right):
        return

    if start_timestamp is None:
        start_timestamp = timestamp
    elapsed_seconds = (timestamp - start_timestamp) / 1e6

    gaze_coords_x = [x for x in [gaze_x_left, gaze_x_right] if x is not None]
    gaze_coords_y = [y for y in [gaze_y_left, gaze_y_right] if y is not None]

    if not gaze_coords_x or not gaze_coords_y:
        return

    gaze_x_avg = sum(gaze_coords_x) / len(gaze_coords_x)
    gaze_y_avg = sum(gaze_coords_y) / len(gaze_coords_y)

    looking_at_interviewer = False
    if current_aoi_bbox:
        xmin, ymin, width, height = (
            current_aoi_bbox["x"],
            current_aoi_bbox["y"],
            current_aoi_bbox["width"],
            current_aoi_bbox["height"],
        )
        looking_at_interviewer = (
            xmin <= gaze_x_avg <= xmin + width and ymin <= gaze_y_avg <= ymin + height
        )

    movement_type = classify_eye_movement((gaze_x_avg, gaze_y_avg), timestamp)

    data = {
        "elapsed_seconds": elapsed_seconds,
        "gaze_x_avg": gaze_x_avg,
        "gaze_y_avg": gaze_y_avg,
        "looking_at_interviewer": looking_at_interviewer,
        "movement_type": movement_type,
    }

    # Emit data to Electron frontend via Socket.IO
    await sio.emit("gaze_data", data)
    logger.info(f"Sent gaze data: {data}")

def gaze_callback(gaze_data: GazeData) -> None:
    asyncio.create_task(handle_gaze_data(
        gaze_data["device_time_stamp"],
        *gaze_data["left_gaze_point_on_display_area"],
        *gaze_data["right_gaze_point_on_display_area"],
        gaze_data["left_pupil_diameter"],
        gaze_data["right_pupil_diameter"],
        gaze_data["left_gaze_point_validity"],
        gaze_data["right_gaze_point_validity"],
    ))

@sio.event
async def connect(sid, environ):
    logger.info(f"Electron connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Electron disconnected: {sid}")

@sio.event
async def update_aoi(sid, data: AOIBoundingBox):
    global current_aoi_bbox
    current_aoi_bbox = data
    logger.info(f"Updated AOI from Electron: {data}")

async def simulate_gaze_data():
    global TEST_MODE
    while TEST_MODE:
        timestamp = int(time.time() * 1e6)
        await handle_gaze_data(
            timestamp,
            random.uniform(0.3, 0.7),
            random.uniform(0.3, 0.7),
            random.uniform(0.3, 0.7),
            random.uniform(0.3, 0.7),
            random.uniform(2.5, 3.5),
            random.uniform(2.5, 3.5),
            1,
            1,
        )
        await asyncio.sleep(0.1)

async def main():
    global TEST_MODE
    trackers = tr.find_all_eyetrackers()
    if trackers:
        tracker = trackers[0]
        logger.info(f"Connected to Tobii: {tracker.model}")
        tracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, gaze_callback, as_dictionary=True)
    else:
        logger.warning("⚠️ No Tobii tracker found. Using TEST_MODE.")
        TEST_MODE = True
        asyncio.create_task(simulate_gaze_data())

    web_runner = web.AppRunner(app)
    await web_runner.setup()
    site = web.TCPSite(web_runner, "localhost", 65432)
    await site.start()
    logger.info("Socket.IO server running at http://localhost:65432")

    while True:
        await asyncio.sleep(3600)  # Keep running

if __name__ == "__main__":
    asyncio.run(main())
