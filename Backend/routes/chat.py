#This handles request from our extension (fetch("/chat-check")
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from models.chat_model import analyze_chat

router = APIRouter()

class Message(BaseModel):
    text: str
    sender: str   # "me" or "other"
    time: float


class ChatRequest(BaseModel):
    chat: List[Message]


@router.post("/chat-check")
def chat_check(data: ChatRequest):

    # Convert Pydantic objects to dict
    chat_data = [
        {
            "text": msg.text,
            "sender": msg.sender,
            "time": msg.time
        }
        for msg in data.chat
    ]

    # Call ML logic
    print("POST HIT")
    result = analyze_chat(chat_data)

    return result