# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
import tempfile
import asyncio
from typing import Optional, List
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import aimakerspace modules
from aimakerspace.text_utils import TextFileLoader, CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.openai_utils.embedding import EmbeddingModel
from aimakerspace.openai_utils.chatmodel import ChatOpenAI

# Initialize FastAPI application with a title
app = FastAPI(title="PDF RAG Chat API")

# Global variable to store the vector database
vector_db = None
pdf_content = None

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4.1-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication

# Define the data model for RAG chat requests
class RAGChatRequest(BaseModel):
    message: str          # User's question about the PDF
    model: Optional[str] = "gpt-4.1-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "developer", "content": request.developer_message},
                    {"role": "user", "content": request.user_message}
                ],
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

# Define PDF upload endpoint for indexing
@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), api_key: str = ""):
    """Upload and index a PDF file for RAG-based chat"""
    global vector_db, pdf_content
    
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Create temporary file to save uploaded PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Load and process the PDF
            loader = TextFileLoader(temp_file_path)
            loader.load()
            pdf_content = loader.documents[0] if loader.documents else ""
            
            if not pdf_content.strip():
                raise HTTPException(status_code=400, detail="PDF appears to be empty or could not be processed")
            
            # Split text into chunks
            splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = splitter.split(pdf_content)
            
            # Set OpenAI API key in environment if provided
            if api_key:
                os.environ["OPENAI_API_KEY"] = api_key
            
            # Create vector database and embed chunks
            embedding_model = EmbeddingModel()
            vector_db = VectorDatabase(embedding_model)
            
            # Build vector database from chunks
            await vector_db.abuild_from_list(chunks)
            
            return {
                "status": "success",
                "message": f"PDF '{file.filename}' uploaded and indexed successfully",
                "chunks_count": len(chunks),
                "total_characters": len(pdf_content)
            }
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

# Define RAG chat endpoint
@app.post("/api/chat-pdf")
async def chat_with_pdf(request: RAGChatRequest):
    """Chat with the uploaded PDF using RAG"""
    global vector_db, pdf_content
    
    try:
        # Check if PDF has been uploaded and indexed
        if vector_db is None:
            raise HTTPException(status_code=400, detail="No PDF has been uploaded yet. Please upload a PDF first.")
        
        # Set OpenAI API key in environment
        os.environ["OPENAI_API_KEY"] = request.api_key
        
        # Search for relevant chunks
        relevant_chunks = vector_db.search_by_text(
            request.message, 
            k=3,  # Get top 3 most relevant chunks
            return_as_text=True
        )
        
        # Create context from relevant chunks
        context = "\n\n".join(relevant_chunks)
        
        # Create RAG prompt
        system_message = f"""You are a helpful assistant that answers questions based on the provided PDF content. 
Use the following context from the PDF to answer the user's question. If the answer cannot be found in the context, 
say so politely and suggest what information might be helpful.

Context from PDF:
{context}"""
        
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": request.message}
                ],
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

# Define endpoint to get PDF status
@app.get("/api/pdf-status")
async def get_pdf_status():
    """Get the status of the currently uploaded PDF"""
    global vector_db, pdf_content
    
    if vector_db is None or pdf_content is None:
        return {
            "uploaded": False,
            "message": "No PDF has been uploaded"
        }
    
    return {
        "uploaded": True,
        "message": "PDF is ready for chat",
        "chunks_count": len(vector_db.vectors) if vector_db else 0,
        "total_characters": len(pdf_content) if pdf_content else 0
    }

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
