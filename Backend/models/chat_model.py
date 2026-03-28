# CHAT BOT DETECTION MODEL
import numpy as np
from sentence_transformers import SentenceTransformer

# Load SBERT model (used for semantic similarity)
model = SentenceTransformer('all-MiniLM-L6-v2')

# 1.RESPONSE TIME 
def response_time_score(chat):
    """
    We measure how fast 'other' replies after 'me'.
    Bots usually reply instantly with low variance.
    Humans have variable response times.
    """

    response_times = []

    for i in range(1, len(chat)):
        prev = chat[i - 1]
        curr = chat[i]

        # Only measure: me → other reply
        if prev["sender"] == "me" and curr["sender"] == "other":
            diff = curr["time"] - prev["time"]
            response_times.append(diff)

    if len(response_times) == 0:
        return 0.5  # neutral if no data

    variance = np.var(response_times)

    # Low variance = suspicious (bot-like)
    return 0.9 if variance < 1000 else 0.3


# 2. TEXT SIMILARITY (ONLY BOT MESSAGES)

def similarity_score(chat):
    """
    Bots repeat similar patterns.
    We compare similarity between bot messages only.
    """

    texts = [msg["text"] for msg in chat if msg["sender"] == "other"]

    if len(texts) < 2:
        return 0.5

    embeddings = model.encode(texts)

    sims = []
    for i in range(1, len(embeddings)):
        sim = np.dot(embeddings[i], embeddings[i - 1]) / (
            np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[i - 1])
        )
        sims.append(sim)

    return float(np.mean(sims))



# 3. REPETITION (BOT MESSAGES ONLY)
def repetition_score(chat):
    """
    Bots repeat exact same messages frequently.
    """

    texts = [msg["text"] for msg in chat if msg["sender"] == "other"]

    if len(texts) == 0:
        return 0.5

    unique = len(set(texts))
    total = len(texts)

    # Higher repetition means more bot-like
    return 1 - (unique / total)

# 4. CONVERSATION UNDERSTANDING

# def conversation_score(chat):
#     """
#     Check if replies are meaningful.
#     Simple heuristic: length + variation.
#     """

#     meaningful = 0
#     total = 0

#     for i in range(1, len(chat)):
#         prev = chat[i - 1]
#         curr = chat[i]

#         # Only evaluate bot replies
#         if prev["sender"] == "me" and curr["sender"] == "other":
#             total += 1

#             # If reply is long enough → meaningful
#             if len(curr["text"].split()) > 3:
#                 meaningful += 1

#     if total == 0:
#         return 0.5

#     return meaningful / total


# FINAL ANALYSIS FUNCTION
def analyze_chat(chat):
    """
    Combines all features into final bot probability.
    """

    rt = response_time_score(chat)
    sim = similarity_score(chat)
    rep = repetition_score(chat)
    # conv = conversation_score(chat)

    # Final bot score
    # bot_score = (
    #     0.3 * rt +           # response pattern
    #     0.3 * sim +          # semantic similarity
    #     0.2 * rep          # repetition
    #     # 0.2 * (1 - conv)     # lack of understanding
    # )

    bot_score = (
        0.4 * rt +
        0.4 * sim +
        0.2 * rep
    )
    return {
        "score": round(bot_score, 2),
        "details": {
            "response_time": round(rt, 2),
            "similarity": round(sim, 2),
            "repetition": round(rep, 2)
            # "conversation": round(conv, 2)
        }
    }


