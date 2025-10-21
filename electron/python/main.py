import asyncio
import math
import random
import time
from collections import deque
from typing import Literal, TypedDict

import socketio
import tobii_research as tr
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
ASYNC_LOOP: asyncio.AbstractEventLoop | None = None
PUBLISH_HZ = 5  # rate-limit feedback emits to avoid spamming UI
GAZE_RATIO_WINDOW_S = 30  # rolling window for gaze-on-interviewer ratio

# latest gaze sample storage (set from Tobii callback, consumed by publisher loop)
_LATEST_GAZE_ARGS: tuple[int, float, float, float, float, float, float, int, int] | None = None
_LAST_SENT_STATE: tuple[bool, bool] | None = None  # (looking_at_interviewer, fixation)
_LOOK_HISTORY: deque[bool] = deque(maxlen=int(GAZE_RATIO_WINDOW_S * PUBLISH_HZ))
_LAST_RATIO_EMIT = 0.0

# Eye movement classification setup
gaze_history = deque(maxlen=5)
fixation_history = deque(maxlen=7)
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

    # Proceed if at least one eye is valid
    if not (validity_left or validity_right):
        return

    if start_timestamp is None:
        start_timestamp = timestamp

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
    else:
        logger.warning("No bounding box found")

    movement_type = classify_eye_movement((gaze_x_avg, gaze_y_avg), timestamp)
    # Smooth fixation signal to reduce rapid flipping
    fixation_history.append(movement_type == "Fixation")
    fixation_active = sum(1 for v in fixation_history if v) >= max(1, int(0.6 * len(fixation_history)))

    # see shared/src/electron.d.ts and electron/src/main.ts for feedback structure
    feedback = [
        {
            "feedbackType": "lookingAtInterviewer",
            "isActive": looking_at_interviewer,
        },
        {"feedbackType": "fixation", "isActive": fixation_active},
    ]

    # Deduplicate: only emit on change to reduce traffic
    global _LAST_SENT_STATE
    current_state = (looking_at_interviewer, fixation_active)
    if _LAST_SENT_STATE != current_state:
        _LAST_SENT_STATE = current_state
        await sio.emit("feedback", feedback)
        logger.info(f"Sent feedback: {feedback}")

    # Update rolling look history and emit ratio at ~1 Hz or on notable change
    _LOOK_HISTORY.append(looking_at_interviewer)
    if len(_LOOK_HISTORY) > 0:
        ratio = sum(1 for v in _LOOK_HISTORY if v) / len(_LOOK_HISTORY)
        # Emit at most ~1 Hz and when change >= 1%
        now_sec = time.time()
        global _LAST_RATIO_EMIT
        if now_sec - _LAST_RATIO_EMIT >= 1.0 or getattr(handle_gaze_data, "_last_ratio", None) is None or abs(getattr(handle_gaze_data, "_last_ratio") - ratio) >= 0.01:
            setattr(handle_gaze_data, "_last_ratio", ratio)
            _LAST_RATIO_EMIT = now_sec
            await sio.emit("gaze_stats", {"gazeOnInterviewerRatio": ratio, "windowSeconds": GAZE_RATIO_WINDOW_S})
            logger.debug(f"Gaze ratio: {ratio:.2%} over {GAZE_RATIO_WINDOW_S}s")


def _store_latest_gaze_args(
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
    global _LATEST_GAZE_ARGS
    _LATEST_GAZE_ARGS = (
        timestamp,
        gaze_x_left,
        gaze_y_left,
        gaze_x_right,
        gaze_y_right,
        pupil_left,
        pupil_right,
        validity_left,
        validity_right,
    )


def gaze_callback(gaze_data: GazeData) -> None:
    # Tobii invokes callbacks on a background thread; forward latest sample to loop thread
    if ASYNC_LOOP is not None:
        ASYNC_LOOP.call_soon_threadsafe(
            _store_latest_gaze_args,
            gaze_data["device_time_stamp"],
            *gaze_data["left_gaze_point_on_display_area"],
            *gaze_data["right_gaze_point_on_display_area"],
            gaze_data["left_pupil_diameter"],
            gaze_data["right_pupil_diameter"],
            gaze_data["left_gaze_point_validity"],
            gaze_data["right_gaze_point_validity"],
        )
    else:
        # Loop not ready yet; drop silently
        return


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
    logger.debug(f"Updated AOI: {data}")


async def simulate_gaze_data():
    global TEST_MODE
    while TEST_MODE:
        timestamp = int(time.time() * 1e6)
        _store_latest_gaze_args(
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
        await asyncio.sleep(0.05)


async def feedback_publisher_loop():
    """Publish feedback at a steady rate using the most recent gaze sample."""
    period = 1.0 / PUBLISH_HZ
    while True:
        if _LATEST_GAZE_ARGS is not None:
            await handle_gaze_data(*_LATEST_GAZE_ARGS)
        await asyncio.sleep(period)


async def main():
    global TEST_MODE, ASYNC_LOOP
    ASYNC_LOOP = asyncio.get_running_loop()
    trackers = tr.find_all_eyetrackers()
    if trackers:
        tracker = trackers[0]
        logger.info(f"Connected to Tobii: {tracker.model}")
        tracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, gaze_callback, as_dictionary=True)
    else:
        logger.warning("No Tobii tracker found. Using TEST_MODE.")
        TEST_MODE = True
        asyncio.create_task(simulate_gaze_data())

    web_runner = web.AppRunner(app)
    await web_runner.setup()
    site = web.TCPSite(web_runner, "localhost", 65432)
    await site.start()
    logger.info("Socket.IO server running at http://localhost:65432")

    # start periodic publisher
    asyncio.create_task(feedback_publisher_loop())

    while True:
        await asyncio.sleep(3600)  # Keep running


if __name__ == "__main__":
    asyncio.run(main())
