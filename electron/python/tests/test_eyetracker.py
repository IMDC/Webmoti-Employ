# ruff: noqa: SLF001, S101


from unittest.mock import AsyncMock

import pytest
from _pytest.monkeypatch import MonkeyPatch

from .. import main as m  # noqa: TID252


# Reset global state before each test
@pytest.fixture(autouse=True)
def reset_globals() -> None:
    """Reset mutable globals before each test."""
    m.gaze_history.clear()
    m.fixation_history.clear()
    m._LOOK_HISTORY.clear()
    m._LAST_SENT_STATE = None
    m._LAST_RATIO = None
    m._LAST_RATIO_EMIT = 0.0
    m.current_aoi_bbox = None


def test_classify_eye_movement_fixation_and_saccade() -> None:
    """Test Fixation and Saccade classification."""
    # Low velocity → Fixation
    m.gaze_history.clear()
    m.gaze_history.append((0, (0.0, 0.0)))
    result = m.classify_eye_movement((0.1, 0.1), 1_000_000)
    assert result == "Fixation"

    # High velocity → Saccade
    m.gaze_history.clear()
    m.gaze_history.append((0, (0.0, 0.0)))
    result = m.classify_eye_movement((1000.0, 1000.0), 1_000_001)
    assert result == "Saccade"


def test_aoi_bbox_inside_outside() -> None:
    """Check simple AOI bounding box logic."""
    m.current_aoi_bbox = {"x": 0, "y": 0, "width": 2, "height": 2}

    # Inside
    gaze_x, gaze_y = 1.0, 1.0
    inside = (
        m.current_aoi_bbox["x"]
        <= gaze_x
        <= m.current_aoi_bbox["x"] + m.current_aoi_bbox["width"]
        and m.current_aoi_bbox["y"]
        <= gaze_y
        <= m.current_aoi_bbox["y"] + m.current_aoi_bbox["height"]
    )
    assert inside

    # Outside
    gaze_x, gaze_y = 3.0, 3.0
    outside = (
        m.current_aoi_bbox["x"]
        <= gaze_x
        <= m.current_aoi_bbox["x"] + m.current_aoi_bbox["width"]
        and m.current_aoi_bbox["y"]
        <= gaze_y
        <= m.current_aoi_bbox["y"] + m.current_aoi_bbox["height"]
    )
    assert not outside


@pytest.mark.asyncio
async def test_handle_gaze_data_simple(monkeypatch: MonkeyPatch) -> None:
    """Async test: handle_gaze_data emits feedback for a valid gaze sample."""
    mock_emit = AsyncMock()
    monkeypatch.setattr(m.sio, "emit", mock_emit)

    # AOI covering (0,0)-(1,1)
    m.current_aoi_bbox = {"x": 0, "y": 0, "width": 1, "height": 1}

    sample = {
        "timestamp": 1,
        "gaze_x_left": 0.5,
        "gaze_y_left": 0.5,
        "gaze_x_right": 0.5,
        "gaze_y_right": 0.5,
        "pupil_left": 3.0,
        "pupil_right": 3.0,
        "validity_left": 1,
        "validity_right": 1,
    }

    await m.handle_gaze_data(sample)

    # Assert emit called at least once
    assert mock_emit.called

    # Check one of the calls is 'feedback'
    calls = [call.args[0] for call in mock_emit.mock_calls]
    assert "feedback" in calls
