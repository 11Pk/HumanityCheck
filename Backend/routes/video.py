# from fastapi import APIRouter
# from pydantic import BaseModel
# import base64
# import numpy as np
# import cv2

# from models.deepfake_model import predict_frames

# router = APIRouter()

# class VideoRequest(BaseModel):
#     frames: list[str]

# @router.post("/analyze-video")
# async def analyze_video(data: VideoRequest):
#     images = []

#     for frame in data.frames:
#         img_data = base64.b64decode(frame.split(",")[1])
#         np_arr = np.frombuffer(img_data, np.uint8)
#         img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
#         images.append(img)

#     prob = predict_frames(images)

#     return {
#         "fake_prob": float(prob)
#     }

# from fastapi import APIRouter
# from pydantic import BaseModel
# import base64
# import numpy as np
# import cv2
# from models.deepfake_model import predict_frames

# router = APIRouter()

# class VideoRequest(BaseModel):
#     frames: list[str]

# @router.post("/analyze-video")
# async def analyze_video(data: VideoRequest):
#     images = []

#     for frame in data.frames:
#         try:
#             # Handle potential data URI prefix (data:image/jpeg;base64,...)
#             header, encoded = frame.split(",", 1) if "," in frame else (None, frame)
#             img_data = base64.b64decode(encoded)
            
#             np_arr = np.frombuffer(img_data, np.uint8)
#             img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            
#             if img is not None:
#                 images.append(img)
#         except Exception as e:
#             print(f"Error decoding frame: {e}")
#             continue

#     if not images:
#         return {"error": "No valid frames processed", "authenticity_score": 0.0}

#     # predict_frames returns MesoNet's raw output (e.g., 0.98 for Real)
#     raw_score = predict_frames(images)

#     return {
#         "authenticity_score": float(raw_score), # 1.0 = 100% Real
#         "is_ai_generated": bool(raw_score < 0.5)
#     }


from fastapi import APIRouter
from pydantic import BaseModel
import base64
import numpy as np
import cv2

# import your model function
from models.deepfake_model import predict_frames

router = APIRouter()

# -------------------------------
# Request Schema
# -------------------------------
class VideoRequest(BaseModel):
    frames: list[str]


# -------------------------------
# Route: Analyze Video
# -------------------------------
@router.post("/analyze-video")
async def analyze_video(data: VideoRequest):
    images = []

    for frame in data.frames:
        try:
            # Remove base64 header
            encoded_data = frame.split(",")[1]

            # Decode base64 → bytes
            img_bytes = base64.b64decode(encoded_data)

            # Convert to numpy array
            np_arr = np.frombuffer(img_bytes, np.uint8)

            # Decode image using OpenCV
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if img is not None:
                images.append(img)

        except Exception as e:
            print("Frame decoding error:", e)

    # If no valid frames
    if len(images) == 0:
        return {
            "real_confidence": 0.5,  # neutral fallback
            "error": "No valid frames received"
        }

    # -------------------------------
    # Model Prediction
    # -------------------------------
    real_confidence = predict_frames(images)

    # Safety clamp (ensure 0–1)
    real_confidence = float(np.clip(real_confidence, 0, 1))

    # -------------------------------
    # Response
    # -------------------------------
    return {
        "real_confidence": real_confidence
    }