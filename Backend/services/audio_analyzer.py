
import numpy as np
import librosa
import io
import soundfile as sf

def analyze_audio(audio_bytes):
    # Load audio
    audio, sr = sf.read(io.BytesIO(audio_bytes))
    
    # Convert to mono if stereo
    if len(audio.shape) > 1:
        audio = np.mean(audio, axis=1)
    
    # Resample to 16kHz
    if sr != 16000:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)
        sr = 16000

    # ---------------- FEATURES ---------------- #

    # 🎤 Pitch
    pitch, _, _ = librosa.pyin(audio, fmin=50, fmax=300)
    pitch = pitch[~np.isnan(pitch)]
    pitch_var = np.var(pitch) if len(pitch) > 0 else 0

    # 🔊 Energy
    energy = librosa.feature.rms(y=audio)[0]
    energy_var = np.var(energy)

    # ⏱️ Pause detection
    intervals = librosa.effects.split(audio, top_db=25)
    pauses = []
    
    for i in range(1, len(intervals)):
        prev_end = intervals[i-1][1]
        curr_start = intervals[i][0]
        pause = (curr_start - prev_end) / sr
        pauses.append(pause)

    pause_var = np.var(pauses) if len(pauses) > 0 else 0
    avg_pause = np.mean(pauses) if len(pauses) > 0 else 0

    # 🔁 Zero Crossing Rate (noise/texture)
    zcr = librosa.feature.zero_crossing_rate(audio)[0]
    zcr_var = np.var(zcr)

    # 🎼 Tempo / speaking rate
    tempo, _ = librosa.beat.beat_track(y=audio, sr=sr)

    # ---------------- SCORING ---------------- #

    score = 0
    flags = []

    # 🎯 Pitch variation
    if pitch_var < 20:
        score += 20
        flags.append("Low pitch variation (AI-like)")
    elif pitch_var > 300:
        score -= 10  # too chaotic = human

    # 🎯 Energy variation
    if energy_var < 0.001:
        score += 15
        flags.append("Flat energy")
    elif energy_var > 0.02:
        score -= 10

    # 🎯 Pause pattern
    if avg_pause < 0.15:
        score += 10
        flags.append("Very short pauses")
    if pause_var < 0.01:
        score += 10
        flags.append("Uniform pauses")

    # 🎯 ZCR (noise level)
    if zcr_var < 0.0001:
        score += 10
        flags.append("Too clean signal")

    # 🎯 Speaking rate
    if tempo > 180:
        score += 10
        flags.append("Fast unnatural speech")

    # ---------------- NORMALIZE ---------------- #

    ai_probability = min(100, max(0, score))

    # Adjust baseline
    ai_probability = int((ai_probability + 50) / 1.5)

    return {
        "aiProbability": ai_probability,
        "label": "Likely AI" if ai_probability > 60 else "Likely Human",
        "features": {
            "pitchVariance": float(pitch_var),
            "energyVariance": float(energy_var),
            "pauseVariance": float(pause_var),
            "avgPause": float(avg_pause),
            "zcrVariance": float(zcr_var),
            "tempo": float(tempo)
        },
        "flags": flags
    }
