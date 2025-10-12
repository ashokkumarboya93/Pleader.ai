from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import google.generativeai as genai
import json
import base64
import io

# Import our utility modules
from rag_utils import get_rag_pipeline
from document_utils import extract_text_from_file, validate_file_type
from export_utils import (
    export_chat_to_pdf, export_chat_to_docx, export_chat_to_txt,
    export_analysis_to_pdf, export_analysis_to_docx, export_analysis_to_txt
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize Gemini API
genai.configure(api_key=os.environ['GEMINI_API_KEY'])

# JWT configuration
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = timedelta(days=7)

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    avatar_url: Optional[str] = None
    auth_provider: str = "email"  # email, google
    preferences: Dict[str, Any] = Field(default_factory=lambda: {
        "theme": "light",
        "language": "en",
        "notifications": True
    })
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_active: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionData(BaseModel):
    session_token: str
    user_id: str
    expires_at: datetime

class Message(BaseModel):
    sender: str  # "user" or "ai"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    attachments: List[str] = Field(default_factory=list)

class Chat(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str = "New Chat"
    messages: List[Message] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SendMessageRequest(BaseModel):
    chat_id: Optional[str] = None
    message: str

class DocumentAnalysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    filename: str
    file_type: str
    analysis_result: Dict[str, Any]
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTHENTICATION HELPERS ====================

def create_token(user_id: str) -> str:
    """Create JWT token"""
    expiration = datetime.now(timezone.utc) + JWT_EXPIRATION
    payload = {
        "user_id": user_id,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("user_id")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Get current user from token (cookie or header)"""
    token = None
    
    # Try to get from cookie first
    token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not token and credentials:
        token = credentials.credentials
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Verify user exists
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user_id

# ==================== AUTHENTICATION ENDPOINTS ====================

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    password_bytes = user_data.password.encode('utf-8')
    hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')
    
    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email,
        auth_provider="email"
    )
    
    user_dict = user.model_dump()
    user_dict["password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_token(user.id)
    
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "avatar_url": user.avatar_url
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password using bcrypt
    password_bytes = credentials.password.encode('utf-8')
    stored_password = user.get("password", "").encode('utf-8')
    if not bcrypt.checkpw(password_bytes, stored_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    token = create_token(user["id"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "avatar_url": user.get("avatar_url")
        }
    }

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Handle Emergent OAuth session creation"""
    try:
        # Get session_id from header
        session_id = request.headers.get("X-Session-ID")
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        # Call Emergent session endpoint
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            ) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=400, detail="Invalid session")
                
                session_data = await resp.json()
        
        # Check if user exists
        user = await db.users.find_one({"email": session_data["email"]})
        
        if not user:
            # Create new user
            new_user = User(
                name=session_data["name"],
                email=session_data["email"],
                avatar_url=session_data.get("picture"),
                auth_provider="google"
            )
            await db.users.insert_one(new_user.model_dump())
            user_id = new_user.id
        else:
            user_id = user["id"]
        
        # Create JWT token
        token = create_token(user_id)
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        return {
            "id": user_id,
            "email": session_data["email"],
            "name": session_data["name"],
            "picture": session_data.get("picture"),
            "session_token": token
        }
    
    except Exception as e:
        logging.error(f"Session creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/logout")
async def logout(response: Response, user_id: str = Depends(get_current_user)):
    """Logout user"""
    response.delete_cookie(key="session_token")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(user_id: str = Depends(get_current_user)):
    """Get current user info"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "avatar_url": user.get("avatar_url"),
        "preferences": user.get("preferences", {})
    }

# ==================== CHAT ENDPOINTS ====================

@api_router.post("/chat/send")
async def send_message(request: SendMessageRequest, user_id: str = Depends(get_current_user)):
    """Send a message and get AI response"""
    try:
        # Get or create chat
        chat = None
        if request.chat_id:
            chat = await db.chats.find_one({"id": request.chat_id, "user_id": user_id})
            if not chat:
                raise HTTPException(status_code=404, detail="Chat not found")
        else:
            # Create new chat
            chat = Chat(
                user_id=user_id,
                title=request.message[:50] + "..." if len(request.message) > 50 else request.message
            )
            chat_dict = chat.model_dump()
            await db.chats.insert_one(chat_dict)
        
        # Add user message
        user_message = Message(
            sender="user",
            content=request.message
        )
        
        # Generate AI response using Gemini
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Build conversation history for context
        messages = chat.get("messages", []) if isinstance(chat, dict) else chat.messages
        conversation_history = "\n".join([
            f"{msg['sender'] if isinstance(msg, dict) else msg.sender}: {msg['content'] if isinstance(msg, dict) else msg.content}"
            for msg in messages[-5:]  # Last 5 messages for context
        ])
        
        # Create prompt with legal context
        prompt = f"""You are Pleader AI, an expert legal assistant specializing in Indian law. 
You provide accurate, helpful legal information and guidance.

Previous conversation:
{conversation_history}

User question: {request.message}

Provide a clear, professional response focusing on Indian legal context. Include relevant laws, sections, or precedents when applicable."""
        
        response = model.generate_content(prompt)
        ai_response_text = response.text
        
        # Create AI message
        ai_message = Message(
            sender="ai",
            content=ai_response_text
        )
        
        # Update chat
        messages_list = chat.get("messages", []) if isinstance(chat, dict) else chat.messages
        messages_list.append(user_message.model_dump())
        messages_list.append(ai_message.model_dump())
        
        chat_id = chat.get("id") if isinstance(chat, dict) else chat.id
        
        await db.chats.update_one(
            {"id": chat_id},
            {
                "$set": {
                    "messages": messages_list,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {
            "chat_id": chat_id,
            "user_message": user_message.model_dump(),
            "ai_message": ai_message.model_dump()
        }
    
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

@api_router.get("/chat/history")
async def get_chat_history(user_id: str = Depends(get_current_user)):
    """Get all chats for user"""
    chats = await db.chats.find({"user_id": user_id}).sort("updated_at", -1).to_list(100)
    return chats

@api_router.get("/chat/{chat_id}")
async def get_chat(chat_id: str, user_id: str = Depends(get_current_user)):
    """Get specific chat"""
    chat = await db.chats.find_one({"id": chat_id, "user_id": user_id})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

@api_router.delete("/chat/{chat_id}")
async def delete_chat(chat_id: str, user_id: str = Depends(get_current_user)):
    """Delete a chat"""
    result = await db.chats.delete_one({"id": chat_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"message": "Chat deleted successfully"}

# ==================== DOCUMENT ENDPOINTS ====================

@api_router.post("/documents/analyze")
async def analyze_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """Analyze a legal document with proper text extraction and RAG indexing"""
    try:
        # Validate file type
        if not validate_file_type(file.filename):
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file type. Supported: PDF, DOCX, TXT, JPG, PNG"
            )
        
        # Read file content
        content = await file.read()
        
        # Extract text using proper extraction utilities
        file_type = file.filename.split('.')[-1].lower()
        text = extract_text_from_file(content, file.filename)
        
        if not text or len(text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Could not extract sufficient text from document"
            )
        
        # Analyze with Gemini
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        prompt = f"""Analyze this legal document and provide a comprehensive analysis:

1. **Key Points**: Identify main clauses, provisions, and important sections
2. **Risk Assessment**: Identify any legal risks or concerns (categorize each as low/medium/high severity)
3. **Suggestions**: Provide recommendations for improvement, clarification, or missing elements
4. **Legal References**: Cite relevant Indian laws, sections, acts, or precedents that apply

Document text:
{text[:8000]}

Provide a detailed, structured analysis. Be specific and professional."""
        
        response = model.generate_content(prompt)
        analysis_text = response.text
        
        # Create analysis result
        analysis_result = {
            "extracted_text": text[:2000] + "..." if len(text) > 2000 else text,
            "full_analysis": analysis_text,
            "text_length": len(text)
        }
        
        # Save document analysis
        doc_analysis = DocumentAnalysis(
            user_id=user_id,
            filename=file.filename,
            file_type=file_type,
            analysis_result=analysis_result
        )
        
        await db.documents.insert_one(doc_analysis.model_dump())
        
        # Index document in RAG pipeline for future queries
        try:
            rag = get_rag_pipeline()
            chunks = rag.chunk_text(text)
            metadata = [
                {
                    "filename": file.filename,
                    "user_id": user_id,
                    "document_id": doc_analysis.id,
                    "chunk_index": i
                }
                for i in range(len(chunks))
            ]
            rag.add_documents(chunks, metadata)
            logger.info(f"Indexed {len(chunks)} chunks from {file.filename} to RAG pipeline")
        except Exception as e:
            logger.warning(f"Failed to index document in RAG: {e}")
            # Continue even if RAG indexing fails
        
        return {
            "id": doc_analysis.id,
            "filename": file.filename,
            "analysis": analysis_result
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Document analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing document: {str(e)}")

@api_router.get("/documents")
async def get_documents(user_id: str = Depends(get_current_user)):
    """Get user's documents"""
    documents = await db.documents.find({"user_id": user_id}).sort("uploaded_at", -1).to_list(50)
    return documents

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str, user_id: str = Depends(get_current_user)):
    """Delete a document"""
    result = await db.documents.delete_one({"id": document_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}

# ==================== USER SETTINGS ====================

@api_router.put("/user/preferences")
async def update_preferences(preferences: Dict[str, Any], user_id: str = Depends(get_current_user)):
    """Update user preferences"""
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"preferences": preferences}}
    )
    return {"message": "Preferences updated successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()