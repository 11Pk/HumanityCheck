import numpy as np
import librosa
import io
import av  # pip install av  ← bundles its own ffmpeg, no system install needed

# ─────────────────────────────────────────────────────────────────────────────
# Convert WEBM → raw float32 numpy array using PyAV (no ffmpeg required)
# pydub was removed because it calls system ffmpeg which is not installed
# ─────────────────────────────────────────────────────────────────────────────
def convert_to_numpy(audio_bytes: bytes):
    """
    Decode any audio format (webm, opus, mp4, etc.) directly to a
    float32 numpy array at the native sample rate, using PyAV.
    No ffmpeg binary needed — av bundles its own.
    """
    container = av.open(io.BytesIO(audio_bytes))
    stream = container.streams.audio[0]
    sr = stream.codec_context.sample_rate

    frames = []
    for frame in container.decode(stream):
        # Convert frame to float32 numpy array (shape: channels × samples)
        arr = frame.to_ndarray().astype(np.float32)
        frames.append(arr)

    container.close()

    if not frames:
        raise ValueError("No audio frames decoded from input")

    # Concatenate along time axis → shape: (channels, total_samples)
    audio = np.concatenate(frames, axis=1)

    # Stereo → mono
    if audio.shape[0] > 1:
        audio = np.mean(audio, axis=0)
    else:
        audio = audio[0]

    return audio, sr


def analyze_audio(audio_bytes: bytes):

    # ── DECODE ────────────────────────────────────────────────────────────────
    audio, sr = convert_to_numpy(audio_bytes)

    # ── NORMALIZE ─────────────────────────────────────────────────────────────
    audio = audio / (np.max(np.abs(audio)) + 1e-6)

    # ── RESAMPLE → 16 kHz ────────────────────────────────────────────────────
    if sr != 16000:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)
        sr = 16000

    # ── TRIM SILENCE ─────────────────────────────────────────────────────────
    audio, _ = librosa.effects.trim(audio)

    # ── FEATURE EXTRACTION ───────────────────────────────────────────────────

    # 🎤 Pitch
    pitch, _, _ = librosa.pyin(audio, fmin=50, fmax=300)
    pitch = pitch[~np.isnan(pitch)]
    pitch_var = float(np.var(pitch)) if len(pitch) > 0 else 0.0

    # 🔊 Energy
    energy = librosa.feature.rms(y=audio)[0]
    energy_var = float(np.var(energy))

    # ⏱️ Pause detection
    intervals = librosa.effects.split(audio, top_db=25)
    pauses = []
    for i in range(1, len(intervals)):
        pause = (intervals[i][0] - intervals[i-1][1]) / sr
        pauses.append(pause)
    pause_var = float(np.var(pauses))  if len(pauses) > 0 else 0.0
    avg_pause = float(np.mean(pauses)) if len(pauses) > 0 else 0.0

    # 🔁 Zero Crossing Rate
    zcr = librosa.feature.zero_crossing_rate(audio)[0]
    zcr_var = float(np.var(zcr))

    # 🎼 Spectral Flatness
    flatness = librosa.feature.spectral_flatness(y=audio)[0]
    flatness_var = float(np.var(flatness))

    # 🎼 MFCC
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
    mfcc_var = float(np.mean(np.var(mfcc, axis=1)))

    # ── SCORING ───────────────────────────────────────────────────────────────
    score = 0
    flags = []

    if pitch_var < 20:
        score += 20
        flags.append("Low pitch variation")
    elif pitch_var > 300:
        score -= 10

    if energy_var < 0.001:
        score += 15
        flags.append("Flat energy")
    elif energy_var > 0.02:
        score -= 10

    if avg_pause < 0.15:
        score += 10
        flags.append("Short pauses")
    if pause_var < 0.01:
        score += 10
        flags.append("Uniform pauses")

    if zcr_var < 0.0001:
        score += 10
        flags.append("Too clean signal")

    if flatness_var < 0.00001:
        score += 10
        flags.append("Low spectral variation")

    if mfcc_var < 50:
        score += 10
        flags.append("Low vocal texture variation")

    # ── NORMALIZE SCORE → 0-100 ───────────────────────────────────────────────
    ai_probability = max(0, min(100, 50 + score))
    label = "Likely AI" if ai_probability > 60 else "Likely Human"

    return {
        "aiProbability": int(ai_probability),
        "label": label,
        "features": {
            "pitchVariance":      pitch_var,
            "energyVariance":     energy_var,
            "pauseVariance":      pause_var,
            "avgPause":           avg_pause,
            "zcrVariance":        zcr_var,
            "spectralFlatnessVar": flatness_var,
            "mfccVar":            mfcc_var
        },
        "flags": flags
    }