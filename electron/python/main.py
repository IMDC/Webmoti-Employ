import asyncio
import math
import random
import sys
import time
from collections import deque
from typing import Literal, TypedDict

import socketio
import tobii_research as tr
from aiohttp import web
from loguru import logger
from watchfiles import run_process

# ===== LOGGER CONFIG ==================================================================

# https://loguru.readthedocs.io/en/stable/resources/migration.html#fundamental-differences-between-logging-and-loguru
# by default loguru logs all logs to sys.stderr and not to sys.stdout
# this makes it hard to differentiate logs in electron, so here we separate the logs

logger.remove()
# Send INFO and DEBUG logs to stdout
logger.add(
    sys.stdout,
    level="DEBUG",
    filter=lambda record: record["level"].no <= logger.level("INFO").no,
    colorize=True,
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}",
)
# Send WARNING and above to stderr
logger.add(
    sys.stderr,
    level="WARNING",
    colorize=True,
    format="<red>{time:HH:mm:ss}</red> | <level>{level: <8}</level> | {message}",
)


# ===== CONSTANTS ======================================================================

STARTED_OUTPUT_STRING = "STARTED_PYTHON_SERVER"

PUBLISH_HZ = 5  # rate-limit feedback emits to avoid spamming UI
GAZE_RATIO_WINDOW_S = 30  # rolling window for gaze-on-interviewer ratio
RATIO_CHANGE_THRESHOLD = 0.01
FIXATION_THRESHOLD_RATIO = 0.6

FIXATION_VELOCITY_THRESHOLD = 100  # pixels per second
MIN_GAZE_POINTS = 2

# for patterned test mode
ON_PHASE_S = 5
OFF_PHASE_S = 15

# ===== TYPES ==========================================================================


class GazeSample(TypedDict):
    """Tobii gaze sample (simplified subset)."""

    timestamp: int
    gaze_x_left: float
    gaze_y_left: float
    gaze_x_right: float
    gaze_y_right: float
    pupil_left: float
    pupil_right: float
    validity_left: int
    validity_right: int


class AOIBoundingBox(TypedDict):
    """AOI data structure from Electron."""

    x: float
    y: float
    width: float
    height: float


class GazeData(TypedDict):
    """Tobii gaze data format."""

    device_time_stamp: int
    left_gaze_point_on_display_area: tuple[float, float]
    right_gaze_point_on_display_area: tuple[float, float]
    left_pupil_diameter: float
    right_pupil_diameter: float
    left_gaze_point_validity: int
    right_gaze_point_validity: int


# ===== STATE ==========================================================================


# Global state
current_aoi_bbox = None
start_timestamp = None
TEST_MODE: Literal[None, "random", "patterned"] = None  # Auto-set if no tracker
ASYNC_LOOP: asyncio.AbstractEventLoop | None = None

# latest gaze sample storage (set from Tobii callback, consumed by publisher loop)
_LATEST_GAZE_ARGS: GazeSample | None = None
_LAST_SENT_STATE: bool | None = None
_LOOK_HISTORY: deque[bool] = deque(maxlen=int(GAZE_RATIO_WINDOW_S * PUBLISH_HZ))
_LAST_RATIO_EMIT = 0.0
_LAST_RATIO: float | None = None


# Eye movement classification setup
gaze_history = deque(maxlen=5)
fixation_history = deque(maxlen=7)


# ===== SERVER =========================================================================

# Setup Socket.IO Server
sio = socketio.AsyncServer(cors_allowed_origins="*")
app = web.Application()
sio.attach(app)


@sio.event
async def connect(sid: str, _: dict) -> None:
    logger.info(f"Electron connected: {sid}")


@sio.event
async def disconnect(sid: str) -> None:
    logger.info(f"Electron disconnected: {sid}")


@sio.event
async def update_aoi(_: str, data: AOIBoundingBox) -> None:
    global current_aoi_bbox  # noqa: PLW0603
    current_aoi_bbox = data
    logger.debug(f"Updated AOI: {data}")


# ===== EYETRACKING ====================================================================


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


async def handle_gaze_data(sample: GazeSample) -> None:
    global start_timestamp  # noqa: PLW0603

    # Proceed if at least one eye is valid
    if not (sample["validity_left"] or sample["validity_right"]):
        return

    if start_timestamp is None:
        start_timestamp = sample["timestamp"]

    gaze_coords_x = [
        x for x in [sample["gaze_x_left"], sample["gaze_x_right"]] if x is not None
    ]
    gaze_coords_y = [
        y for y in [sample["gaze_y_left"], sample["gaze_y_right"]] if y is not None
    ]

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
    # else:
    #     logger.warning("No bounding box found")

    movement_type = classify_eye_movement((gaze_x_avg, gaze_y_avg), sample["timestamp"])
    fixation_history.append(movement_type == "Fixation")

    # see shared/src/electron.d.ts and electron/src/main.ts for feedback structure
    feedback = [
        {
            "feedbackType": "lookingAtInterviewer",
            "isActive": looking_at_interviewer,
        }
    ]

    # Deduplicate: only emit on change to reduce traffic
    global _LAST_SENT_STATE  # noqa: PLW0603
    if looking_at_interviewer != _LAST_SENT_STATE:
        _LAST_SENT_STATE = looking_at_interviewer
        await sio.emit("feedback", feedback)
        logger.info(f"Sent feedback: {feedback}")

    # Update rolling look history and emit ratio at ~1 Hz or on notable change
    _LOOK_HISTORY.append(looking_at_interviewer)
    if len(_LOOK_HISTORY) > 0:
        ratio = sum(1 for v in _LOOK_HISTORY if v) / len(_LOOK_HISTORY)
        # Emit at most ~1 Hz and when change >= 1%
        now_sec = time.time()
        global _LAST_RATIO_EMIT  # noqa: PLW0603
        global _LAST_RATIO  # noqa: PLW0603
        if (
            _LAST_RATIO is None
            or abs(_LAST_RATIO - ratio) >= RATIO_CHANGE_THRESHOLD
            or now_sec - _LAST_RATIO_EMIT >= 1.0
        ):
            _LAST_RATIO = ratio
            _LAST_RATIO_EMIT = now_sec
            await sio.emit(
                "gaze_stats",
                {"gazeOnInterviewerRatio": ratio, "windowSeconds": GAZE_RATIO_WINDOW_S},
            )
            # logger.debug(f"Gaze ratio: {ratio:.2%} over {GAZE_RATIO_WINDOW_S}s")


def _store_latest_gaze_args(sample: GazeSample) -> None:
    global _LATEST_GAZE_ARGS  # noqa: PLW0603
    _LATEST_GAZE_ARGS = sample


def gaze_callback(gaze_data: GazeData) -> None:
    # Tobii invokes callbacks on a background thread;
    # forward latest sample to loop thread
    if ASYNC_LOOP is not None:
        sample: GazeSample = {
            "timestamp": gaze_data["device_time_stamp"],
            "gaze_x_left": gaze_data["left_gaze_point_on_display_area"][0],
            "gaze_y_left": gaze_data["left_gaze_point_on_display_area"][1],
            "gaze_x_right": gaze_data["right_gaze_point_on_display_area"][0],
            "gaze_y_right": gaze_data["right_gaze_point_on_display_area"][1],
            "pupil_left": gaze_data["left_pupil_diameter"],
            "pupil_right": gaze_data["right_pupil_diameter"],
            "validity_left": gaze_data["left_gaze_point_validity"],
            "validity_right": gaze_data["right_gaze_point_validity"],
        }

        ASYNC_LOOP.call_soon_threadsafe(_store_latest_gaze_args, sample)
    else:
        # Loop not ready yet; drop silently
        return


async def simulate_gaze_data() -> None:
    """Simulate gaze for the selected TEST_MODE with configurable on/off durations."""
    toggle_on = True
    next_toggle_time = time.time() + ON_PHASE_S  # start with on-phase

    while TEST_MODE:
        now = time.time()

        if TEST_MODE == "random":
            # random gaze anywhere on screen
            gaze_value = random.uniform(0.3, 0.7)  # noqa: S311
        elif TEST_MODE == "patterned":
            # switch on/off according to durations
            if now >= next_toggle_time:
                toggle_on = not toggle_on
                next_toggle_time = now + (ON_PHASE_S if toggle_on else OFF_PHASE_S)
            gaze_value = 0.5 if toggle_on else 0.0

        _store_latest_gaze_args(
            {
                "timestamp": int(now * 1e6),
                "gaze_x_left": gaze_value,
                "gaze_y_left": gaze_value,
                "gaze_x_right": gaze_value,
                "gaze_y_right": gaze_value,
                "pupil_left": 3.0,
                "pupil_right": 3.0,
                "validity_left": 1,
                "validity_right": 1,
            },
        )

        await asyncio.sleep(0.05)


async def feedback_publisher_loop() -> None:
    """Publish feedback at a steady rate using the most recent gaze sample."""
    period = 1.0 / PUBLISH_HZ
    while True:
        if _LATEST_GAZE_ARGS is not None:
            await handle_gaze_data(_LATEST_GAZE_ARGS)
        await asyncio.sleep(period)


# ======================================================================================


async def main() -> None:
    global TEST_MODE, ASYNC_LOOP  # noqa: PLW0603
    ASYNC_LOOP = asyncio.get_running_loop()
    trackers = tr.find_all_eyetrackers()
    if trackers:
        tracker = trackers[0]
        logger.info(f"Connected to Tobii: {tracker.model}")
        tracker.subscribe_to(tr.EYETRACKER_GAZE_DATA, gaze_callback, as_dictionary=True)
    else:
        logger.warning("No Tobii tracker found. Using TEST_MODE.")
        TEST_MODE = "patterned"  # "random" or "patterned"
        asyncio.create_task(simulate_gaze_data())  # noqa: RUF006

    web_runner = web.AppRunner(app)
    await web_runner.setup()
    site = web.TCPSite(web_runner, "localhost", 65432)
    await site.start()
    logger.info(STARTED_OUTPUT_STRING)

    # start periodic publisher
    asyncio.create_task(feedback_publisher_loop())  # noqa: RUF006

    stop_event = asyncio.Event()
    await stop_event.wait()  # Keep running


def run_main_sync() -> None:
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(main())
    except KeyboardInterrupt:
        logger.info("Ctrl+C pressed, shutting down...")
    finally:
        # cancel all remaining tasks
        tasks = asyncio.all_tasks(loop)
        for t in tasks:
            t.cancel()
        loop.run_until_complete(asyncio.gather(*tasks, return_exceptions=True))
        loop.close()


if __name__ == "__main__":
    # pyinstaller sets this attribute
    is_dev = not getattr(sys, "frozen", False)

    if is_dev:
        logger.info("Running dev Python server")
        try:
            # enable hot reload so any change to files in this directory will rerun main
            run_process(".", target=run_main_sync)
        except KeyboardInterrupt:
            logger.info("Ctrl+C pressed, shutting down dev server...")
    else:
        logger.info("Running packaged Python server")
        run_main_sync()
