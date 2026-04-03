"""
Inicializador de modelos para Enhanced Agent
"""

from enhanced_agent import enhanced_agent
from langchain_community.llms import LlamaCpp, Ollama
import os
import httpx

def initialize_models():
    """Inicializa los modelos 270M y 1B usando los modelos disponibles"""
    
    # Usar el modelo existente como 270M (más rápido)
    MODEL_270M_PATH = "./models/Qwen2.5-1.5B-Instruct-Q8_0.gguf"
    
    # Para 1B, usar Ollama si está disponible, sino el mismo modelo con más tokens
    MODEL_1B_PATH = MODEL_270M_PATH  # Mismo modelo, configuración diferente
    
    model_270m = None
    model_1b = None
    
    # Función para verificar Ollama
    def check_ollama_available():
        try:
            response = httpx.get("http://localhost:11434/api/tags", timeout=5.0)
            return response.status_code == 200
        except:
            return False
    
    # Inicializar modelo 270M (configuración rápida)
    if os.path.exists(MODEL_270M_PATH):
        try:
            model_270m = LlamaCpp(
                model_path=MODEL_270M_PATH,
                temperature=0.7,
                max_tokens=50,       # Muy corto para velocidad
                n_ctx=512,           # Contexto mínimo
                n_threads=1,         # Un solo thread para ser más rápido
                verbose=False,
                stop=["Human:", "User:", "\n\n"]
            )
            print("✅ Modelo 270M (rápido) cargado")
        except Exception as e:
            print(f"❌ Error cargando 270M: {e}")
    
    # Inicializar modelo 1B (configuración potente)
    if check_ollama_available():
        try:
            # Usar Ollama como modelo 1B (más potente)
            model_1b = Ollama(
                model="gemma3:1b",
                base_url="http://localhost:11434",
                temperature=0.8
            )
            print("✅ Modelo 1B (Ollama gemma3:1b) cargado")
        except Exception as e:
            print(f"❌ Error cargando Ollama: {e}")
            # Fallback al modelo local con configuración potente
            if os.path.exists(MODEL_1B_PATH):
                try:
                    model_1b = LlamaCpp(
                        model_path=MODEL_1B_PATH,
                        temperature=0.8,
                        max_tokens=300,      # Respuestas largas
                        n_ctx=2048,          # Contexto amplio
                        n_threads=4,         # Más threads para mejor calidad
                        verbose=False
                    )
                    print("✅ Modelo 1B (local) cargado como fallback")
                except Exception as e2:
                    print(f"❌ Error cargando 1B local: {e2}")
    else:
        # Si no hay Ollama, usar el modelo local con configuración potente
        if os.path.exists(MODEL_1B_PATH):
            try:
                model_1b = LlamaCpp(
                    model_path=MODEL_1B_PATH,
                    temperature=0.8,
                    max_tokens=300,
                    n_ctx=2048,
                    n_threads=4,
                    verbose=False
                )
                print("✅ Modelo 1B (local) cargado")
            except Exception as e:
                print(f"❌ Error cargando 1B: {e}")
    
    # Configurar enhanced_agent
    enhanced_agent.initialize_models(model_270m, model_1b)
    
    # Mostrar estado final
    status = enhanced_agent.get_system_status()
    print(f"🚀 Enhanced Agent inicializado:")
    print(f"   - 270M disponible: {status['models']['270m_available']}")
    print(f"   - 1B disponible: {status['models']['1b_available']}")
    
    return model_270m, model_1b

if __name__ == "__main__":
    # Inicializar modelos cuando se ejecuta directamente
    model_270m, model_1b = initialize_models()
    
    # Test simple task (should use 270M)
    result = enhanced_agent.process_message('Hola, ¿cómo estás?')
    print('SIMPLE TASK:', result['model_used'])
    
    # Test complex task (should use 1B)  
    result = enhanced_agent.process_message('Explica la teoría de la relatividad de Einstein')
    print('COMPLEX TASK:', result['model_used'])
