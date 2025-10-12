"""
RAG (Retrieval Augmented Generation) utilities for Pleader AI
Implements document chunking, FAISS indexing, Gemini embeddings, and retrieval with re-ranking
"""

import os
import logging
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import google.generativeai as genai
import faiss
from pathlib import Path
import json
import pickle

logger = logging.getLogger(__name__)

# Initialize Gemini API
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

class RAGPipeline:
    """RAG pipeline with FAISS vector store and Gemini embeddings"""
    
    def __init__(self, index_dir: str = "/app/backend/faiss_index"):
        self.index_dir = Path(index_dir)
        self.index_dir.mkdir(exist_ok=True)
        self.index = None
        self.documents = []  # Store document chunks with metadata
        self.dimension = 768  # Gemini embedding dimension
        self.index_file = self.index_dir / "faiss_index.bin"
        self.docs_file = self.index_dir / "documents.pkl"
        
        # Load existing index if available
        self._load_index()
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
        """
        Split text into overlapping chunks
        
        Args:
            text: Input text to chunk
            chunk_size: Size of each chunk in characters
            overlap: Overlap between chunks
            
        Returns:
            List of text chunks
        """
        if not text or len(text) == 0:
            return []
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                
                if break_point > chunk_size // 2:  # Only break if we're past halfway
                    chunk = chunk[:break_point + 1]
                    end = start + break_point + 1
            
            chunks.append(chunk.strip())
            start = end - overlap
        
        return [c for c in chunks if len(c) > 50]  # Filter very short chunks
    
    def generate_embedding(self, text: str) -> Optional[np.ndarray]:
        """
        Generate embedding for text using Gemini
        
        Args:
            text: Input text
            
        Returns:
            Numpy array of embeddings or None on error
        """
        try:
            result = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document"
            )
            return np.array(result['embedding'], dtype=np.float32)
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return None
    
    def generate_query_embedding(self, query: str) -> Optional[np.ndarray]:
        """
        Generate embedding for query using Gemini
        
        Args:
            query: Search query
            
        Returns:
            Numpy array of embeddings or None on error
        """
        try:
            result = genai.embed_content(
                model="models/embedding-001",
                content=query,
                task_type="retrieval_query"
            )
            return np.array(result['embedding'], dtype=np.float32)
        except Exception as e:
            logger.error(f"Error generating query embedding: {e}")
            return None
    
    def add_documents(self, texts: List[str], metadata: List[Dict[str, Any]]):
        """
        Add documents to the FAISS index
        
        Args:
            texts: List of text chunks
            metadata: List of metadata dicts for each chunk
        """
        if not texts:
            return
        
        # Initialize index if needed
        if self.index is None:
            self.index = faiss.IndexFlatL2(self.dimension)
        
        # Generate embeddings
        embeddings = []
        valid_texts = []
        valid_metadata = []
        
        for i, text in enumerate(texts):
            embedding = self.generate_embedding(text)
            if embedding is not None:
                embeddings.append(embedding)
                valid_texts.append(text)
                valid_metadata.append(metadata[i])
        
        if not embeddings:
            logger.warning("No valid embeddings generated")
            return
        
        # Add to FAISS index
        embeddings_array = np.array(embeddings, dtype=np.float32)
        self.index.add(embeddings_array)
        
        # Store documents with metadata
        for text, meta in zip(valid_texts, valid_metadata):
            self.documents.append({
                "text": text,
                "metadata": meta
            })
        
        # Save index
        self._save_index()
        logger.info(f"Added {len(embeddings)} documents to index. Total: {len(self.documents)}")
    
    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for relevant documents
        
        Args:
            query: Search query
            k: Number of results to return
            
        Returns:
            List of relevant documents with scores
        """
        if self.index is None or len(self.documents) == 0:
            logger.warning("Index is empty")
            return []
        
        # Generate query embedding
        query_embedding = self.generate_query_embedding(query)
        if query_embedding is None:
            return []
        
        # Search FAISS index
        query_embedding = query_embedding.reshape(1, -1)
        distances, indices = self.index.search(query_embedding, min(k, len(self.documents)))
        
        # Retrieve documents
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.documents):
                doc = self.documents[idx].copy()
                doc['score'] = float(1 / (1 + dist))  # Convert distance to similarity score
                doc['distance'] = float(dist)
                results.append(doc)
        
        return results
    
    def rerank_results(self, query: str, results: List[Dict[str, Any]], top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Re-rank results using Gemini for better relevance
        
        Args:
            query: Original query
            results: Initial search results
            top_k: Number of top results to return
            
        Returns:
            Re-ranked results
        """
        if not results:
            return []
        
        try:
            # Use Gemini to score relevance
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            scored_results = []
            for result in results:
                prompt = f"""On a scale of 0-10, rate how relevant this text is to the query.
Only respond with a number.

Query: {query}

Text: {result['text'][:500]}

Relevance score (0-10):"""
                
                try:
                    response = model.generate_content(prompt)
                    score_text = response.text.strip()
                    # Extract number from response
                    score = float(''.join(c for c in score_text if c.isdigit() or c == '.'))
                    score = min(max(score, 0), 10)  # Clamp between 0-10
                    result['rerank_score'] = score
                    scored_results.append(result)
                except:
                    # If re-ranking fails, keep original score
                    result['rerank_score'] = result['score'] * 10
                    scored_results.append(result)
            
            # Sort by rerank score
            scored_results.sort(key=lambda x: x['rerank_score'], reverse=True)
            return scored_results[:top_k]
            
        except Exception as e:
            logger.error(f"Error in re-ranking: {e}")
            # Fallback to original ranking
            return results[:top_k]
    
    def query(self, query: str, top_k: int = 3, use_rerank: bool = True) -> Tuple[List[Dict[str, Any]], str]:
        """
        Query the RAG pipeline and generate grounded response
        
        Args:
            query: User query
            top_k: Number of top results
            use_rerank: Whether to use re-ranking
            
        Returns:
            Tuple of (retrieved documents, generated response)
        """
        # Search for relevant documents
        results = self.search(query, k=top_k * 2)
        
        if not results:
            return [], "I don't have enough information in my knowledge base to answer this question accurately. Please try uploading relevant legal documents first."
        
        # Re-rank if requested
        if use_rerank and len(results) > top_k:
            results = self.rerank_results(query, results, top_k)
        else:
            results = results[:top_k]
        
        # Generate response with retrieved context
        context = "\n\n".join([
            f"Document {i+1} (from {doc['metadata'].get('filename', 'Unknown')}):\n{doc['text']}"
            for i, doc in enumerate(results)
        ])
        
        try:
            model = genai.GenerativeModel('gemini-2.5-pro')
            prompt = f"""You are Pleader AI, an expert legal assistant specializing EXCLUSIVELY in Indian law.

Context from documents:
{context}

Question: {query}

STRICT INSTRUCTIONS:
- Answer ONLY based on the provided context from uploaded documents
- You must ONLY discuss Indian legal framework, acts, sections, and precedents
- Do NOT reference laws from other jurisdictions (US, UK, etc.) unless explicitly comparing to Indian law
- Cite specific document names, section numbers, article numbers, or case references when making claims
- Format your response with clear headings, bullet points, and structured sections
- If the context doesn't contain sufficient information, clearly state: "Based on the uploaded documents, I don't have enough information to answer this fully."
- Include relevant Indian legal references: Acts, Articles of Constitution, IPC sections, case law citations
- Be professional, precise, and grounded strictly in Indian legal context

Answer (with citations):"""
            
            response = model.generate_content(prompt)
            answer = response.text
            
            return results, answer
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return results, f"I found relevant information but encountered an error generating the response: {str(e)}"
    
    def _save_index(self):
        """Save FAISS index and documents to disk"""
        try:
            if self.index is not None:
                faiss.write_index(self.index, str(self.index_file))
            
            with open(self.docs_file, 'wb') as f:
                pickle.dump(self.documents, f)
            
            logger.info(f"Index saved with {len(self.documents)} documents")
        except Exception as e:
            logger.error(f"Error saving index: {e}")
    
    def _load_index(self):
        """Load FAISS index and documents from disk"""
        try:
            if self.index_file.exists() and self.docs_file.exists():
                self.index = faiss.read_index(str(self.index_file))
                
                with open(self.docs_file, 'rb') as f:
                    self.documents = pickle.load(f)
                
                logger.info(f"Loaded index with {len(self.documents)} documents")
        except Exception as e:
            logger.warning(f"Could not load existing index: {e}")
            self.index = None
            self.documents = []
    
    def clear_index(self):
        """Clear the entire index"""
        self.index = None
        self.documents = []
        
        if self.index_file.exists():
            self.index_file.unlink()
        if self.docs_file.exists():
            self.docs_file.unlink()
        
        logger.info("Index cleared")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get index statistics"""
        return {
            "total_documents": len(self.documents),
            "index_initialized": self.index is not None,
            "index_size": self.index.ntotal if self.index else 0
        }


# Global RAG pipeline instance
_rag_pipeline = None

def get_rag_pipeline() -> RAGPipeline:
    """Get or create global RAG pipeline instance"""
    global _rag_pipeline
    if _rag_pipeline is None:
        _rag_pipeline = RAGPipeline()
    return _rag_pipeline
