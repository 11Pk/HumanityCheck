from services.audio_analyzer import analyze_audio
from fastapi import FastAPI, File, UploadFile
from fastapi import APIRouter

router = APIRouter()
@router.post("/analyze-audio")
async def analyze(file: UploadFile = File(...)):
    contents = await file.read()
    
    result = analyze_audio(contents)
    
    return result