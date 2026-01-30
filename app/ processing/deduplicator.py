import faiss
import numpy as np
from app.utils.embeddings import embed_texts

SIMILARITY_THRESHOLD = 0.15

def deduplicate(texts):
    if len(texts) <= 1:
        return texts

    embeddings = embed_texts(texts)
    dim = embeddings.shape[1]

    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    unique_texts = []

    for i, emb in enumerate(embeddings):
        distances, indices = index.search(np.array([emb]), 2)
        if distances[0][1] > SIMILARITY_THRESHOLD:
            unique_texts.append(texts[i])

    return unique_texts
