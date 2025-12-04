import hashlib
from typing import List, Optional, Dict, Any
from uuid import uuid4
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from langchain_chroma import Chroma
import chromadb
from chromadb.api import ClientAPI
import os
from backend.config import GEMINI_API_KEY, CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE

_client = None

class LongTermMemoryStore:
    def __init__(self, memory_collection_name: str = "default_collection"):
        # Set the API key as environment variable for Google embeddings
        if GEMINI_API_KEY:
            os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY
        
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004"
        )
        self.collection_name = memory_collection_name
        self.vectorstore = Chroma(
            collection_name=memory_collection_name,
            embedding_function=self.embeddings,
            client=self._get_chroma_client()
        )
    
    def store(self, texts: List[str], metadatas: Optional[List[Dict[str, Any]]] = None) -> List[str]:
        """
        Store texts in the vector store using add_documents method.
        
        Args:
            texts: List of text strings to store
            metadatas: Optional list of metadata dictionaries for each text
            
        Returns:
            List of document IDs
        """
        if metadatas is None:
            metadatas = [{} for _ in texts]
        
        # Create Document objects
        documents = [
            Document(page_content=text, metadata=metadata)
            for text, metadata in zip(texts, metadatas)
        ]
        
        # Generate unique IDs using uuid4
        ids = [str(uuid4()) for _ in range(len(documents))]
        
        # Add documents to the vector store
        self.vectorstore.add_documents(documents=documents, ids=ids)
        
        return ids
    
    def search(
        self, 
        query: str, 
        k: int = 5,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents in the vector store using similarity_search_with_score.
        
        Args:
            query: Search query string
            k: Number of results to return (default: 5)
            filter: Optional metadata filter (e.g., {"source": "tweet"})
            
        Returns:
            List of dictionaries containing content, metadata, and similarity score
        """
        # Perform similarity search with score
        results = self.vectorstore.similarity_search_with_score(
            query=query,
            k=k,
            filter=filter
        )
        
        # Format results
        formatted_results = []
        for doc, score in results:
            formatted_results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": score
            })
        
        return formatted_results
    
    def delete(self, ids: List[str]) -> None:
        """
        Delete documents from the vector store by their IDs.
        
        Args:
            ids: List of document IDs to delete
        """
        self.vectorstore.delete(ids=ids)
    
    def update_document(self, document_id: str, text: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Update a single document in the vector store.
        
        Args:
            document_id: The ID of the document to update
            text: New text content
            metadata: Optional new metadata
        """
        document = Document(page_content=text, metadata=metadata or {})
        self.vectorstore.update_document(document_id=document_id, document=document)
    
    def delete_all(self) -> bool:
        """
        Delete all documents in this collection.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            client = self._get_chroma_client()
            collection = client.get_collection(name=self.collection_name)
            all_ids = collection.get()['ids']
            if all_ids:
                collection.delete(ids=all_ids)
            print(f"[MEMORY] Deleted all {len(all_ids)} documents from collection {self.collection_name}")
            return True
        except Exception as e:
            print(f"[MEMORY] Error deleting documents from collection {self.collection_name}: {e}")
            return False
    
    def delete_collection(self) -> bool:
        """
        Delete the entire collection from ChromaDB.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            client = self._get_chroma_client()
            client.delete_collection(name=self.collection_name)
            print(f"[MEMORY] Deleted collection {self.collection_name}")
            return True
        except Exception as e:
            print(f"[MEMORY] Error deleting collection {self.collection_name}: {e}")
            return False
    
    def _get_chroma_client(self) -> ClientAPI:
        """Get or create Chroma client."""
        global _client
        if _client is None:
            _client = chromadb.CloudClient(
                database=CHROMA_DATABASE,
                tenant=CHROMA_TENANT,
                api_key=CHROMA_API_KEY
            )
        return _client


def delete_group_memory(group_id: str) -> bool:
    """
    Delete all memory associated with a group.
    
    Args:
        group_id: The group ID whose memory should be deleted
        
    Returns:
        True if successful, False otherwise
    """
    try:
        collection_name = f"agent_{group_id}_memory"
        memory_store = LongTermMemoryStore(memory_collection_name=collection_name)
        return memory_store.delete_collection()
    except Exception as e:
        print(f"[MEMORY] Error deleting group memory for {group_id}: {e}")
        return False      