from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from chatmodel import analyze_chat  # your existing model file

router = APIRouter()

class Message(BaseModel):
    text: str
    sender: str   # "me" or "other"
    time: float   # seconds (from Telegram timestamp or positional proxy)

class ChatRequest(BaseModel):
    chat: List[Message]

@router.post("/chat-check")
def check_chat(request: ChatRequest):
    # Convert Pydantic models to plain dicts that chatmodel.py expects
    chat_dicts = [
        {"text": m.text, "sender": m.sender, "time": m.time}
        for m in request.chat
    ]

    if len(chat_dicts) < 2:
        return {
            "score": 0.5,
            "details": {
                "response_time": 0.5,
                "similarity": 0.5,
                "repetition": 0.5
            },
            "status": "insufficient_data"
        }

    result = analyze_chat(chat_dicts)
    return result