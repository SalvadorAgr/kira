from langchain_community.llms import LlamaCpp, Ollama
from langchain_community.tools import Tool
from langchain_core.prompts import PromptTemplate
from database import save_message, get_chat_history
from tools.system import open_app, set_volume, get_battery_status
from tools.apps import open_url, create_file_on_desktop
import os
import httpx

# Tools definition matches previous...
tools = [
    Tool(
        name="Open App",
        func=open_app,
        description="Opens a macOS application. Input should be the exact application name."
    ),
    Tool(
        name="Set Volume",
        func=lambda x: set_volume(int(x)) if x.isdigit() else "Error: Volume must be a number",
        description="Sets the system volume. Input must be a number between 0 and 100."
    ),
    Tool(
        name="Get Battery",
        func=lambda x: get_battery_status(),
        description="Gets the current battery status. No input required."
    ),
    Tool(
        name="Open URL",
        func=open_url,
        description="Opens a website URL in the default browser."
    ),
    Tool(
        name="Create File",
        func=lambda x: create_file_on_desktop(*x.split(",", 1)) if "," in x else "Error: Input must be 'filename,content'",
        description="Creates a file on the Desktop. Input format: 'filename,content'."
    )
]

# Configure Embedded Llama Model (Local)
MODEL_PATH = "./models/Qwen2.5-1.5B-Instruct-Q8_0.gguf"

# Initialize local model if available
local_llm = None
if os.path.exists(MODEL_PATH):
    try:
        local_llm = LlamaCpp(
            model_path=MODEL_PATH,
            temperature=0.7,
            max_tokens=150,  # Reduced for faster responses
            top_p=0.9,
            verbose=False,  # Reduced verbosity
            n_ctx=2048,     # Reduced context window
            n_threads=4,    # Use multiple threads
            stop=["Human:", "User:", "\n\n"]  # Stop tokens for shorter responses
        )
        print("✅ Local model loaded successfully")
    except Exception as e:
        print(f"❌ Error loading local model: {e}")
        local_llm = None
else:
    print(f"❌ Local model not found at {MODEL_PATH}")

# Initialize Ollama model
ollama_llm = None
def check_ollama_available():
    try:
        response = httpx.get("http://localhost:11434/api/tags", timeout=5.0)
        return response.status_code == 200
    except:
        return False

if check_ollama_available():
    try:
        ollama_llm = Ollama(
            model="gemma3:1b",
            base_url="http://localhost:11434",
            temperature=0.7
        )
        print("✅ Ollama connection established")
    except Exception as e:
        print(f"❌ Error connecting to Ollama: {e}")
        ollama_llm = None
else:
    print("❌ Ollama not available on localhost:11434")

# Determine which model to use (priority: Ollama > Local)
if ollama_llm:
    llm = ollama_llm
    model_type = "ollama"
    print("🚀 Using Ollama model")
elif local_llm:
    llm = local_llm
    model_type = "local"
    print("🚀 Using local model")
else:
    llm = None
    model_type = "none"
    print("❌ No models available")

def process_user_message(user_input: str, project_id: int = 1) -> str:
    print(f"Processing: {user_input}")
    
    if not llm:
        output = "Error: No hay modelos disponibles. Instala Ollama o el modelo local."
        return output
    
    try:
        # Get conversation history for context
        history = get_chat_history(limit=8, project_id=project_id)
        
        # Add model info to response for debugging
        model_info = f"[{model_type.upper()}] "
        
        # Optimize prompt based on model type
        if model_type == "local":
            # For local model, use simpler context
            if history:
                context_msgs = []
                for msg in history[-4:]:  # Last 4 messages only
                    role_name = "Usuario" if msg["role"] == "user" else "Asistente"
                    # Clean previous model prefixes from history
                    clean_content = msg['content'].replace("[LOCAL]", "").replace("[OLLAMA]", "").strip()
                    context_msgs.append(f"{role_name}: {clean_content}")
                
                conversation_context = "\n".join(context_msgs)
                optimized_input = f"{conversation_context}\nUsuario: {user_input}\nAsistente:"
            else:
                optimized_input = f"Usuario: {user_input}\nAsistente:"
        else:
            # For Ollama, use more natural conversation format
            if history:
                context_msgs = []
                for msg in history[-6:]:  # Last 6 messages
                    # Clean previous model prefixes from history
                    clean_content = msg['content'].replace("[LOCAL]", "").replace("[OLLAMA]", "").strip()
                    context_msgs.append(f"{msg['role']}: {clean_content}")
                
                conversation_context = "\n".join(context_msgs)
                optimized_input = f"Conversación previa:\n{conversation_context}\n\nuser: {user_input}\nassistant:"
            else:
                optimized_input = user_input
            
        response = llm.invoke(optimized_input)
        
        # Clean up response (remove model prefixes if they appear in the response)
        response = response.replace("[LOCAL]", "").replace("[OLLAMA]", "").strip()
        
        # Truncate very long responses from local model
        if model_type == "local" and len(response) > 400:
            response = response[:400] + "..."
            
        output = model_info + response
    except Exception as e:
        output = f"Error del sistema ({model_type}): {str(e)}"
    
    return output

def switch_to_local_model():
    """Switch to local model if available"""
    global llm, model_type
    if local_llm:
        llm = local_llm
        model_type = "local"
        return "Cambiado a modelo local"
    return "Modelo local no disponible"

def switch_to_ollama_model(model_name="gemma3:1b"):
    """Switch to Ollama model if available"""
    global llm, model_type, ollama_llm
    if check_ollama_available():
        try:
            ollama_llm = Ollama(
                model=model_name,
                base_url="http://localhost:11434",
                temperature=0.7
            )
            llm = ollama_llm
            model_type = "ollama"
            return f"Cambiado a Ollama modelo: {model_name}"
        except Exception as e:
            return f"Error cambiando a Ollama: {e}"
    return "Ollama no disponible"

# For compatibility with main.py
agent_executor = None
