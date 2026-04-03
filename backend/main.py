from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import init_db, save_message, get_projects, create_project, get_chat_history
from agent import process_user_message
# Enhanced Agent imports
from enhanced_agent import enhanced_agent
from model_orchestrator import orchestrator
from approval_system import approval_system
from anti_hallucination import anti_hallucination

import os
import shutil
from pathlib import Path
import speech_recognition as sr
from gtts import gTTS
import aiofiles
from io import BytesIO

app = FastAPI(title="Psykira Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKSPACE_DIR = os.path.join(os.getcwd(), "workspace")
os.makedirs(WORKSPACE_DIR, exist_ok=True)

class ChatRequest(BaseModel):
    message: str
    project_id: int = 1

class ProjectRequest(BaseModel):
    name: str

class ChatResponse(BaseModel):
    response: str

@app.on_event("startup")
def startup_event():
    init_db()
    # Inicializar modelos del enhanced agent
    try:
        from initialize_models import initialize_models
        initialize_models()
        print("✅ Enhanced Agent models initialized")
    except Exception as e:
        print(f"⚠️ Enhanced Agent initialization failed: {e}")
        print("   Falling back to basic agent only")

@app.get("/")
def read_root():
    return {"status": "Psykira V2 (Gemma 3 1b) Online"}

@app.get("/projects")
def list_projects():
    return get_projects()

@app.post("/projects")
def new_project(req: ProjectRequest):
    proj = create_project(req.name)
    if not proj:
        raise HTTPException(status_code=400, detail="Project already exists")
    return proj

@app.get("/chat/{project_id}")
def history(project_id: int):
    return get_chat_history(limit=50, project_id=project_id)

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # Pass project_id to save_message via generic process?
        # Needed to update agent.py to accept project_id context
        # For quickly, i will refactor process_user_message
        response_text = process_user_message_wrapper(request.message, request.project_id)
        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Wrapper to handle project_id without breaking agent.py signature yet
def process_user_message_wrapper(text, project_id):
    # Save user message first
    save_message("user", text, project_id=project_id)
    
    try:
        # Process with conversation context
        response = process_user_message(text, project_id=project_id)
        output = response
    except Exception as e:
        output = f"Error: {e}"
    
    # Save assistant response
    save_message("assistant", output, project_id=project_id)
    return output

@app.post("/upload/audio")
async def upload_audio(file: UploadFile = File(...)):
    # ... previous code ...
    # (Abbreviated for tool call, assuming overwrite)
    # Actually I should keep the file as full content to avoid missing parts
    # Re-implementing full file content below
    try:
        temp_filename = f"temp_{file.filename}"
        async with aiofiles.open(temp_filename, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
            
        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_filename) as source:
            audio_data = recognizer.record(source)
            try:
                text = recognizer.recognize_google(audio_data, language="es-ES")
            except sr.UnknownValueError:
                text = ""
            except sr.RequestError:
                text = "Error en servicio STT"
        
        os.remove(temp_filename)
        
        if not text:
            return {"text": "", "response": "No pude escuchar nada claro."}

        # Uses default project 1 for voice commands currently
        ai_response = process_user_message_wrapper(text, 1) 
        return {"text": text, "response": ai_response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/file")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(WORKSPACE_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Notify default project
        msg = f"[SISTEMA] El usuario subió el archivo {file.filename}"
        process_user_message_wrapper(msg, 1)
        
        return {"filename": file.filename, "status": "uploaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tts")
async def text_to_speech(request: ChatRequest):
    try:
        tts = gTTS(text=request.message, lang='es')
        audio_fp = BytesIO()
        tts.write_to_fp(audio_fp)
        audio_fp.seek(0)
        return StreamingResponse(audio_fp, media_type="audio/mp3")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/status")
def get_model_status():
    from agent import model_type, local_llm, ollama_llm
    return {
        "current_model": model_type,
        "local_available": local_llm is not None,
        "ollama_available": ollama_llm is not None
    }

@app.post("/model/switch/local")
def switch_to_local():
    from agent import switch_to_local_model
    result = switch_to_local_model()
    return {"message": result}

@app.post("/model/switch/ollama")
def switch_to_ollama(model_name: str = "llama3.2:3b"):
    from agent import switch_to_ollama_model
    result = switch_to_ollama_model(model_name)
    return {"message": result}



# Enhanced Agent Endpoints
@app.post("/chat/enhanced", response_model=ChatResponse)
async def enhanced_chat_endpoint(request: ChatRequest):
    """Endpoint mejorado con orquestación y aprobaciones"""
    try:
        response_data = enhanced_agent.process_message(request.message, request.project_id)
        return ChatResponse(response=response_data["response"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/system/status")
def get_system_status():
    """Estado del sistema de orquestación"""
    return enhanced_agent.get_system_status()

@app.get("/approvals/pending")
def get_pending_approvals():
    """Solicitudes de aprobación pendientes"""
    return approval_system.get_pending_requests()

@app.get("/approvals/history")
def get_approval_history():
    """Historial de aprobaciones"""
    return approval_system.get_approval_history()

@app.post("/approvals/{request_id}/approve")
def approve_request(request_id: str, reason: dict = {"reason": ""}):
    """Aprobar solicitud"""
    success = approval_system.approve_request(request_id, reason.get("reason", ""))
    if success:
        return {"status": "approved", "request_id": request_id}
    raise HTTPException(status_code=404, detail="Request not found")

@app.post("/approvals/{request_id}/deny")
def deny_request(request_id: str, reason: dict = {"reason": ""}):
    """Denegar solicitud"""
    success = approval_system.deny_request(request_id, reason.get("reason", ""))
    if success:
        return {"status": "denied", "request_id": request_id}
    raise HTTPException(status_code=404, detail="Request not found")

@app.get("/orchestrator/stats")
def get_orchestrator_stats():
    """Estadísticas del orquestador"""
    return orchestrator.get_performance_stats()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
