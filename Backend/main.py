from fastapi import FastAPI, File, UploadFile
# from services.audio_analyzer import analyze_audio
from routes.chat import router as chat_router
from routes.video import router as video_router
from fastapi.middleware.cors import CORSMiddleware


# from fastapi import FastAPI

# from routes.liveness import router as liveness_router
# from routes.active_liveness import router as active_router

app = FastAPI()

#ENABLE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# include chat route
app.include_router(chat_router)
app.include_router(video_router)
# include liveness route
# app.include_router(liveness_router)
# app.include_router(active_router)
# @app.post("/analyze-audio")
# async def analyze(file: UploadFile = File(...)):
#     contents = await file.read()
    
#     result = analyze_audio(contents)
    
#     return result

@app.get("/")
def home():
    return {"message": "Backend Running"}

