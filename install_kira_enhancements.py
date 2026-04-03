#!/usr/bin/env python3
"""
Script de instalación rápida para las mejoras de Kira
Copia todos los archivos necesarios y configura el sistema
"""

import os
import shutil
import json
from pathlib import Path

# Rutas
CURRENT_DIR = Path.cwd()
KIRA_PROJECT = Path("/Users/black/Documents/Kira")
BACKEND_DIR = KIRA_PROJECT / "backend"
FRONTEND_DIR = KIRA_PROJECT / "frontend" / "src" / "components"

def copy_backend_files():
    """Copia archivos del backend"""
    print("📁 Copiando archivos del backend...")
    
    backend_files = [
        "model_orchestrator.py",
        "approval_system.py", 
        "anti_hallucination.py",
        "enhanced_agent.py"
    ]
    
    for file in backend_files:
        src = CURRENT_DIR / file
        dst = BACKEND_DIR / file
        
        if src.exists():
            shutil.copy2(src, dst)
            print(f"  ✅ {file} -> {dst}")
        else:
            print(f"  ❌ {file} no encontrado")

def copy_frontend_files():
    """Copia archivos del frontend"""
    print("📁 Copiando archivos del frontend...")
    
    frontend_files = [
        "ModelOrchestrator.tsx",
        "ApprovalPanel.tsx"
    ]
    
    # Crear directorio si no existe
    FRONTEND_DIR.mkdir(parents=True, exist_ok=True)
    
    for file in frontend_files:
        src = CURRENT_DIR / file
        dst = FRONTEND_DIR / file
        
        if src.exists():
            shutil.copy2(src, dst)
            print(f"  ✅ {file} -> {dst}")
        else:
            print(f"  ❌ {file} no encontrado")

def update_backend_main():
    """Actualiza main.py para usar el enhanced_agent"""
    print("🔧 Actualizando main.py...")
    
    main_py = BACKEND_DIR / "main.py"
    
    if not main_py.exists():
        print("  ❌ main.py no encontrado")
        return
    
    # Leer contenido actual
    with open(main_py, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Agregar imports del enhanced_agent
    new_imports = """
# Enhanced Agent imports
from enhanced_agent import enhanced_agent
from model_orchestrator import orchestrator
from approval_system import approval_system
from anti_hallucination import anti_hallucination
"""
    
    # Insertar después de los imports existentes
    if "from agent import process_user_message" in content:
        content = content.replace(
            "from agent import process_user_message",
            "from agent import process_user_message" + new_imports
        )
    
    # Agregar nuevos endpoints
    new_endpoints = '''

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
'''
    
    # Agregar antes del if __name__ == "__main__":
    if 'if __name__ == "__main__":' in content:
        content = content.replace(
            'if __name__ == "__main__":',
            new_endpoints + '\n\nif __name__ == "__main__":'
        )
    
    # Escribir archivo actualizado
    with open(main_py, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("  ✅ main.py actualizado")

def create_model_initialization():
    """Crea script para inicializar modelos"""
    print("🤖 Creando inicializador de modelos...")
    
    init_script = BACKEND_DIR / "initialize_models.py"
    
    content = '''"""
Inicializador de modelos para Enhanced Agent
"""

from enhanced_agent import enhanced_agent
from langchain_community.llms import LlamaCpp
import os

def initialize_models():
    """Inicializa los modelos 270M y 1B"""
    
    # Rutas de los modelos (ajustar según tu configuración)
    MODEL_270M_PATH = "./models/gemma-270m-q8_0.gguf"  # Ajustar ruta
    MODEL_1B_PATH = "./models/gemma-1b-q8_0.gguf"      # Ajustar ruta
    
    model_270m = None
    model_1b = None
    
    # Inicializar modelo 270M
    if os.path.exists(MODEL_270M_PATH):
        try:
            model_270m = LlamaCpp(
                model_path=MODEL_270M_PATH,
                temperature=0.7,
                max_tokens=100,
                n_ctx=1024,
                n_threads=2,
                verbose=False
            )
            print("✅ Modelo 270M cargado")
        except Exception as e:
            print(f"❌ Error cargando 270M: {e}")
    
    # Inicializar modelo 1B
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
            print("✅ Modelo 1B cargado")
        except Exception as e:
            print(f"❌ Error cargando 1B: {e}")
    
    # Configurar enhanced_agent
    enhanced_agent.initialize_models(model_270m, model_1b)
    print("🚀 Enhanced Agent inicializado")
    
    return model_270m, model_1b

if __name__ == "__main__":
    initialize_models()
'''
    
    with open(init_script, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✅ {init_script}")

def update_frontend_app():
    """Actualiza App.tsx para incluir nuevos componentes"""
    print("🎨 Actualizando frontend...")
    
    app_tsx = KIRA_PROJECT / "frontend" / "src" / "App.tsx"
    
    if not app_tsx.exists():
        print("  ❌ App.tsx no encontrado")
        return
    
    # Crear componente de navegación mejorado
    enhanced_app = KIRA_PROJECT / "frontend" / "src" / "EnhancedApp.tsx"
    
    content = '''import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { ModelOrchestrator } from './components/ModelOrchestrator';
import { ApprovalPanel } from './components/ApprovalPanel';
import { ChatProvider } from './context/ChatContext';
import { Brain, Shield, MessageSquare, Settings } from 'lucide-react';

type ActiveView = 'chat' | 'orchestrator' | 'approvals' | 'settings';

function EnhancedApp() {
  const [activeView, setActiveView] = useState<ActiveView>('chat');

  const renderActiveView = () => {
    switch (activeView) {
      case 'chat':
        return <ChatInterface />;
      case 'orchestrator':
        return <ModelOrchestrator />;
      case 'approvals':
        return <ApprovalPanel />;
      case 'settings':
        return <div className="p-4 text-white">Configuración (próximamente)</div>;
      default:
        return <ChatInterface />;
    }
  };

  const navItems = [
    { id: 'chat' as ActiveView, icon: MessageSquare, label: 'Chat' },
    { id: 'orchestrator' as ActiveView, icon: Brain, label: 'Modelos' },
    { id: 'approvals' as ActiveView, icon: Shield, label: 'Aprobaciones' },
    { id: 'settings' as ActiveView, icon: Settings, label: 'Config' },
  ];

  return (
    <ChatProvider>
      <div className="h-screen w-screen bg-transparent flex overflow-hidden">
        <div className="flex-1 flex glass-panel overflow-hidden rounded-xl border border-white/10 shadow-2xl">
          {/* Top Drag Region */}
          <div className="absolute top-0 left-0 w-full h-6 z-50 flex items-center justify-center app-drag-region cursor-move hover:bg-white/5 transition-colors">
            <div className="w-16 h-1 bg-white/20 rounded-full"></div>
          </div>
          
          {/* Enhanced Navigation */}
          <div className="w-16 bg-gray-900/50 border-r border-gray-700 flex flex-col items-center py-8 mt-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                    activeView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-6 h-6" />
                </button>
              );
            })}
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex">
            {activeView === 'chat' && <Sidebar />}
            <div className="flex-1">
              {renderActiveView()}
            </div>
          </div>
        </div>
      </div>
    </ChatProvider>
  );
}

export default EnhancedApp;
'''
    
    with open(enhanced_app, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✅ EnhancedApp.tsx creado")

def create_readme():
    """Crea README con instrucciones"""
    print("📝 Creando documentación...")
    
    readme = KIRA_PROJECT / "ENHANCED_README.md"
    
    content = '''# Kira Enhanced - Sistema de Orquestación Inteligente

## 🚀 Características Nuevas

### 1. Orquestación de Modelos
- **270M**: Modelo ligero para tareas simples (0.5s promedio)
- **1B**: Modelo potente para tareas complejas (2.0s promedio)
- **Escalamiento automático**: 270M delega a 1B cuando es necesario

### 2. Sistema de Aprobaciones
- **Aprobación obligatoria** para acceso al sistema
- **Evaluación de riesgo** automática (Alto/Medio/Bajo)
- **Timeout de 30 segundos** para solicitudes
- **Historial completo** de aprobaciones

### 3. Anti-Alucinación
- **Detección de alucinaciones** en tiempo real
- **Validación de respuestas** antes del envío
- **Sanitización automática** de contenido problemático
- **Restricciones de acciones** sin aprobación

## 🛠️ Instalación

1. **Copiar archivos** (ya hecho por el script):
   ```bash
   python3 install_kira_enhancements.py
   ```

2. **Inicializar modelos**:
   ```bash
   cd backend
   python3 initialize_models.py
   ```

3. **Instalar dependencias** (si es necesario):
   ```bash
   pip install langchain-community
   ```

4. **Ejecutar backend**:
   ```bash
   python3 main.py
   ```

5. **Ejecutar frontend**:
   ```bash
   cd ../frontend
   npm start
   ```

## 🎯 Uso

### Chat Mejorado
- Usa `/api/chat/enhanced` en lugar de `/api/chat`
- Respuestas automáticamente orquestadas
- Validación anti-alucinación incluida

### Monitoreo
- **Estado del sistema**: `/api/system/status`
- **Estadísticas**: `/api/orchestrator/stats`
- **Aprobaciones**: `/api/approvals/pending`

### UI Mejorada
- **Navegación por pestañas**: Chat, Modelos, Aprobaciones
- **Monitoreo en tiempo real** del estado de los modelos
- **Panel de aprobaciones** interactivo

## 🔒 Seguridad

- ✅ **Aprobación obligatoria** para acciones del sistema
- ✅ **Validación de entrada** y salida
- ✅ **Timeout automático** de solicitudes
- ✅ **Logging completo** de actividades
- ✅ **Restricciones anti-alucinación**

## 📊 Métricas

El sistema registra automáticamente:
- Tasa de éxito por modelo
- Tiempo de respuesta promedio
- Complejidad de tareas
- Historial de aprobaciones

## 🚨 Troubleshooting

### Modelos no cargan
1. Verificar rutas en `initialize_models.py`
2. Asegurar que los archivos `.gguf` existen
3. Verificar permisos de lectura

### Aprobaciones no funcionan
1. Verificar que el backend esté corriendo
2. Comprobar endpoints en `/api/approvals/`
3. Revisar logs del sistema

### UI no actualiza
1. Verificar conexión con backend
2. Comprobar intervalos de actualización
3. Revisar consola del navegador

## 🎉 ¡Listo!

Tu asistente Kira ahora tiene:
- 🧠 **Orquestación inteligente** de modelos
- 🔐 **Control de acceso** con aprobaciones
- 🛡️ **Protección anti-alucinación**
- 📊 **Monitoreo en tiempo real**
'''
    
    with open(readme, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✅ {readme}")

def main():
    """Función principal de instalación"""
    print("🚀 Instalando mejoras para Kira...")
    print(f"📁 Proyecto Kira: {KIRA_PROJECT}")
    
    if not KIRA_PROJECT.exists():
        print(f"❌ Proyecto Kira no encontrado en {KIRA_PROJECT}")
        return
    
    try:
        copy_backend_files()
        copy_frontend_files()
        update_backend_main()
        create_model_initialization()
        update_frontend_app()
        create_readme()
        
        print("\n✅ ¡Instalación completada!")
        print("\n📋 Próximos pasos:")
        print("1. cd /Users/black/Documents/Kira/backend")
        print("2. python3 initialize_models.py")
        print("3. python3 main.py")
        print("4. En otra terminal: cd ../frontend && npm start")
        print("\n🎉 ¡Tu asistente Kira está listo con orquestación inteligente!")
        
    except Exception as e:
        print(f"❌ Error durante la instalación: {e}")

if __name__ == "__main__":
    main()