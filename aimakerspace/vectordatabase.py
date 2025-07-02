import numpy as np
from collections import defaultdict
from typing import List, Tuple, Callable
from aimakerspace.openai_utils.embedding import EmbeddingModel
import asyncio


def cosine_similarity(vector_a: np.array, vector_b: np.array) -> float:
    """Computes the cosine similarity between two vectors."""
    dot_product = np.dot(vector_a, vector_b)
    norm_a = np.linalg.norm(vector_a)
    norm_b = np.linalg.norm(vector_b)
    return dot_product / (norm_a * norm_b)


def euclidean_distance(vector_a: np.array, vector_b: np.array) -> float:
    """Computes the Euclidean distance between two vectors (converted to similarity)."""
    # Ensure inputs are numpy arrays
    vector_a = np.array(vector_a)
    vector_b = np.array(vector_b)
    
    distance = np.linalg.norm(vector_a - vector_b)
    return 1 / (1 + distance)  # Convert to similarity score


def manhattan_distance(vector_a: np.array, vector_b: np.array) -> float:
    """Computes the Manhattan distance between two vectors (converted to similarity)."""
    # Ensure inputs are numpy arrays
    vector_a = np.array(vector_a)
    vector_b = np.array(vector_b)
    
    distance = np.sum(np.abs(vector_a - vector_b))
    return 1 / (1 + distance)  # Convert to similarity score


def dot_product_similarity(vector_a: np.array, vector_b: np.array) -> float:
    """Computes the dot product similarity between two vectors."""
    # Ensure inputs are numpy arrays
    vector_a = np.array(vector_a)
    vector_b = np.array(vector_b)
    
    return np.dot(vector_a, vector_b)


def jaccard_similarity(vector_a: np.array, vector_b: np.array) -> float:
    """Computes Jaccard similarity for binary vectors."""
    # Ensure inputs are numpy arrays
    vector_a = np.array(vector_a)
    vector_b = np.array(vector_b)
    
    # Binarize vectors (threshold at 0)
    bin_a = (vector_a > 0).astype(int)
    bin_b = (vector_b > 0).astype(int)
    
    intersection = np.sum(bin_a & bin_b)
    union = np.sum(bin_a | bin_b)
    
    if union == 0:
        return 0.0
    return intersection / union


# Dictionary of available distance metrics
DISTANCE_METRICS = {
    "cosine": cosine_similarity,
    "euclidean": euclidean_distance,
    "manhattan": manhattan_distance,
    "dot_product": dot_product_similarity,
    "jaccard": jaccard_similarity
}


class VectorDatabase:
    def __init__(self, embedding_model: EmbeddingModel = None):
        self.vectors = defaultdict(np.array)
        self.metadata = defaultdict(dict)  # Add metadata storage
        self.embedding_model = embedding_model or EmbeddingModel()

    def insert(self, key: str, vector: np.array, metadata: dict = None) -> None:
        """Insert vector with optional metadata"""
        self.vectors[key] = vector
        if metadata:
            self.metadata[key] = metadata

    def search(
        self,
        query_vector: np.array,
        k: int,
        distance_measure: Callable = cosine_similarity,
        filter_metadata: dict = None,
    ) -> List[Tuple[str, float]]:
        """Search with optional metadata filtering"""
        scores = []
        
        for key, vector in self.vectors.items():
            # Apply metadata filtering if specified
            if filter_metadata:
                doc_metadata = self.metadata.get(key, {})
                if not all(doc_metadata.get(meta_key) == meta_value 
                          for meta_key, meta_value in filter_metadata.items()):
                    continue
            
            score = distance_measure(query_vector, vector)
            scores.append((key, score))
        
        return sorted(scores, key=lambda x: x[1], reverse=True)[:k]

    def search_by_text(
        self,
        query_text: str,
        k: int,
        distance_measure: Callable = cosine_similarity,
        return_as_text: bool = False,
        filter_metadata: dict = None,
    ) -> List[Tuple[str, float]]:
        query_vector = self.embedding_model.get_embedding(query_text)
        results = self.search(query_vector, k, distance_measure, filter_metadata)
        return [result[0] for result in results] if return_as_text else results

    def search_by_metric_name(
        self,
        query_text: str,
        k: int,
        metric_name: str = "cosine",
        return_as_text: bool = False,
        filter_metadata: dict = None,
    ) -> List[Tuple[str, float]]:
        """Search using metric name instead of function"""
        if metric_name not in DISTANCE_METRICS:
            raise ValueError(f"Unknown metric: {metric_name}. Available: {list(DISTANCE_METRICS.keys())}")
        
        distance_measure = DISTANCE_METRICS[metric_name]
        return self.search_by_text(query_text, k, distance_measure, return_as_text, filter_metadata)

    def retrieve_from_key(self, key: str) -> np.array:
        return self.vectors.get(key, None)

    def get_metadata(self, key: str) -> dict:
        """Get metadata for a specific document"""
        return self.metadata.get(key, {})

    def update_metadata(self, key: str, metadata: dict) -> None:
        """Update metadata for an existing document"""
        if key in self.vectors:
            self.metadata[key].update(metadata)
        else:
            raise KeyError(f"Document with key '{key}' not found")

    def filter_by_metadata(self, metadata_filter: dict) -> List[str]:
        """Get all document keys that match metadata criteria"""
        matching_keys = []
        for key, doc_metadata in self.metadata.items():
            if all(doc_metadata.get(meta_key) == meta_value 
                   for meta_key, meta_value in metadata_filter.items()):
                matching_keys.append(key)
        return matching_keys

    async def abuild_from_list(self, list_of_text: List[str], metadata_list: List[dict] = None) -> "VectorDatabase":
        """Build database with optional metadata for each text"""
        embeddings = await self.embedding_model.async_get_embeddings(list_of_text)
        
        for i, (text, embedding) in enumerate(zip(list_of_text, embeddings)):
            metadata = metadata_list[i] if metadata_list and i < len(metadata_list) else None
            self.insert(text, np.array(embedding), metadata)
        
        return self


if __name__ == "__main__":
    list_of_text = [
        "I like to eat broccoli and bananas.",
        "I ate a banana and spinach smoothie for breakfast.",
        "Chinchillas and kittens are cute.",
        "My sister adopted a kitten yesterday.",
        "Look at this cute hamster munching on a piece of broccoli.",
    ]

    vector_db = VectorDatabase()
    vector_db = asyncio.run(vector_db.abuild_from_list(list_of_text))
    k = 2

    searched_vector = vector_db.search_by_text("I think fruit is awesome!", k=k)
    print(f"Closest {k} vector(s):", searched_vector)

    retrieved_vector = vector_db.retrieve_from_key(
        "I like to eat broccoli and bananas."
    )
    print("Retrieved vector:", retrieved_vector)

    relevant_texts = vector_db.search_by_text(
        "I think fruit is awesome!", k=k, return_as_text=True
    )
    print(f"Closest {k} text(s):", relevant_texts)
