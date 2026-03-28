import numpy as np
import librosa
import io
import soundfile as sf
from pydub import AudioSegment

# 🔧 Convert WEBM → WAV
def convert_to_wav(audio_bytes):
    audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format="webm")
    
    wav_io = io.BytesIO()
    audio.export(wav_io, format="wav")
    wav_io.seek(0)

    return wav_io


def analyze_audio(audio_bytes):
    # ---------------- CONVERT ---------------- #
    wav_io = convert_to_wav(audio_bytes)

    # ---------------- LOAD ---------------- #
    audio, sr = sf.read(wav_io)

    # Convert stereo → mono
    if len(audio.shape) > 1:
        audio = np.mean(audio, axis=1)

    # Normalize
    audio = audio / np.max(np.abs(audio) + 1e-6)

    # Resample → 16kHz
    if sr != 16000:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)
        sr = 16000

    # Trim silence
    audio, _ = librosa.effects.trim(audio)

    # ---------------- FEATURE EXTRACTION ---------------- #

#     # 🎤 Pitch
#     pitch, _, _ = librosa.pyin(audio, fmin=50, fmax=300)
#     pitch = pitch[~np.isnan(pitch)]
#     pitch_var = np.var(pitch) if len(pitch) > 0 else 0

#     # 🔊 Energy
#     energy = librosa.feature.rms(y=audio)[0]
#     energy_var = np.var(energy)

    # ⏱️ Pause detection
    intervals = librosa.effects.split(audio, top_db=25)

    pauses = []
    for i in range(1, len(intervals)):
        prev_end = intervals[i-1][1]
        curr_start = intervals[i][0]
        pause = (curr_start - prev_end) / sr
        pauses.append(pause)

#     pause_var = np.var(pauses) if len(pauses) > 0 else 0
#     avg_pause = np.mean(pauses) if len(pauses) > 0 else 0

    # 🔁 Zero Crossing Rate (noise)
    zcr = librosa.feature.zero_crossing_rate(audio)[0]
    zcr_var = np.var(zcr)

    # 🎼 Spectral flatness (important for AI voices)
    spectral_flatness = librosa.feature.spectral_flatness(y=audio)[0]
    flatness_var = np.var(spectral_flatness)

    # 🎼 MFCC (texture)
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
    mfcc_var = np.mean(np.var(mfcc, axis=1))

#     # ---------------- SCORING ---------------- #

#     score = 0
#     flags = []

    # 🎤 Pitch
    if pitch_var < 20:
        score += 20
        flags.append("Low pitch variation")
    elif pitch_var > 300:
        score -= 10

    # 🔊 Energy
    if energy_var < 0.001:
        score += 15
        flags.append("Flat energy")
    elif energy_var > 0.02:
        score -= 10

    # ⏱️ Pause behavior
    if avg_pause < 0.15:
        score += 10
        flags.append("Short pauses")
    if pause_var < 0.01:
        score += 10
        flags.append("Uniform pauses")

    # 🔁 Noise (ZCR)
    if zcr_var < 0.0001:
        score += 10
        flags.append("Too clean signal")

    # 🎼 Spectral flatness
    if flatness_var < 0.00001:
        score += 10
        flags.append("Low spectral variation")

    # 🎼 MFCC
    if mfcc_var < 50:
        score += 10
        flags.append("Low vocal texture variation")

#     # ---------------- NORMALIZE ---------------- #

    base = 50
    ai_probability = base + score

    ai_probability = max(0, min(100, ai_probability))

    label = "Likely AI" if ai_probability > 60 else "Likely Human"

    # ---------------- RESPONSE ---------------- #

    return {
        "aiProbability": int(ai_probability),
        "label": label,
        "features": {
            "pitchVariance": float(pitch_var),
            "energyVariance": float(energy_var),
            "pauseVariance": float(pause_var),
            "avgPause": float(avg_pause),
            "zcrVariance": float(zcr_var),
            "spectralFlatnessVar": float(flatness_var),
            "mfccVar": float(mfcc_var)
        },
        "flags": flags
    }
