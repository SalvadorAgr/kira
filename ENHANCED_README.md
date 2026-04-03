# Kira Enhanced - Sistema de Orquestación Inteligente

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
