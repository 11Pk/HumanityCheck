from fastapi import FastAPI, File, UploadFile
from services.audio_analyzer import analyze_audio

app = FastAPI()

@app.post("/analyze-audio")
async def analyze(file: UploadFile = File(...)):
    contents = await file.read()
    
    result = analyze_audio(contents)
    
    return result