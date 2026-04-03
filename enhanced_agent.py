"""
Enhanced Agent - Agente mejorado con orquestación, aprobaciones y anti-alucinación
Para el proyecto Kira del cliente
"""

import time
from typing import Dict, Optional, Tuple
from model_orchestrator import orchestrator, TaskComplexity
from approval_system import approval_system, ApprovalStatus
from anti_hallucination import anti_hallucination, ResponseValidation

class EnhancedAgent:
    def __init__(self):
        self.model_270m = None  # Se inicializará con el modelo 270M
        self.model_1b = None    # Se inicializará con el modelo 1B
        self.current_model = None
        self.conversation_context = []
        
    def initialize_models(self, model_270m, model_1b):
        """Inicializa los modelos locales"""
        self.model_270m = model_270m
        self.model_1b = model_1b
        self.current_model = model_270m  # Empezar con el modelo ligero
        
    def process_message(self, user_input: str, project_id: int = 1) -> Dict:
        """Procesa un mensaje del usuario con orquestación inteligente"""
        
        start_time = time.time()
        
        # 1. Analizar complejidad de la tarea
        recommendation = orchestrator.get_model_recommendation(user_input)
        
        # 2. Verificar si requiere aprobación del sistema
        if recommendation["requires_approval"]:
            return self._handle_system_task(user_input, recommendation)
        
        # 3. Procesar con el modelo apropiado
        response_data = self._process_with_model(user_input, recommendation)
        
        # 4. Validar respuesta contra alucinaciones
        validation_result, validation_reason = anti_hallucination.validate_response(
            user_input, response_data["response"]
        )
        
        # 5. Sanitizar respuesta si es necesario
        if validation_result != ResponseValidation.VALID:
            response_data["response"] = anti_hallucination.sanitize_response(
                response_data["response"], validation_result
            )
            response_data["validation_warning"] = validation_reason
        
        # 6. Registrar métricas
        execution_time = time.time() - start_time
        orchestrator.log_task_execution(
            user_input, 
            response_data["model_used"], 
            validation_result == ResponseValidation.VALID,
            execution_time
        )
        
        # 7. Actualizar contexto de conversación
        self._update_conversation_context(user_input, response_data["response"])
        
        return {
            **response_data,
            "complexity": recommendation["complexity"],
            "validation": validation_result.value,
            "execution_time": execution_time,
            "timestamp": time.time()
        }
    
    def _handle_system_task(self, user_input: str, recommendation: Dict) -> Dict:
        """Maneja tareas que requieren aprobación del sistema"""
        
        # Evaluar riesgo
        risk_assessment = approval_system.get_risk_assessment(user_input)
        
        # Crear solicitud de aprobación
        approval_request = approval_system.request_approval(
            task_description=f"Usuario solicita: {user_input}",
            requested_action=user_input,
            risk_level=risk_assessment["level"]
        )
        
        # Si fue auto-aprobada o auto-denegada
        if approval_request.status != ApprovalStatus.PENDING:
            if approval_request.status == ApprovalStatus.APPROVED:
                return self._execute_approved_task(user_input, recommendation)
            else:
                return {
                    "response": f"❌ Solicitud denegada: {approval_request.user_response}",
                    "model_used": "system",
                    "requires_approval": True,
                    "approval_status": approval_request.status.value,
                    "risk_level": risk_assessment["level"]
                }
        
        # Solicitud pendiente - esperar aprobación
        return {
            "response": f"🔐 **Aprobación requerida**\n\n"
                       f"**Tarea:** {user_input}\n"
                       f"**Riesgo:** {risk_assessment['level'].upper()}\n"
                       f"**ID:** {approval_request.id}\n\n"
                       f"¿Aprobar esta acción? (Expira en 30 segundos)",
            "model_used": "system",
            "requires_approval": True,
            "approval_request_id": approval_request.id,
            "risk_level": risk_assessment["level"],
            "expires_at": approval_request.expires_at
        }
    
    def _execute_approved_task(self, user_input: str, recommendation: Dict) -> Dict:
        """Ejecuta una tarea que ya fue aprobada"""
        
        # Procesar con el modelo apropiado
        response_data = self._process_with_model(user_input, recommendation)
        
        # Agregar confirmación de ejecución
        response_data["response"] = f"✅ **Tarea aprobada y ejecutada**\n\n{response_data['response']}"
        response_data["approved_execution"] = True
        
        return response_data
    
    def _process_with_model(self, user_input: str, recommendation: Dict) -> Dict:
        """Procesa el input con el modelo recomendado"""
        
        recommended_model = recommendation["recommended_model"]
        config = recommendation["config"]
        
        # Seleccionar modelo
        if recommended_model == "270m" and self.model_270m:
            model = self.model_270m
            model_name = "270m"
        elif recommended_model == "1b" and self.model_1b:
            model = self.model_1b
            model_name = "1b"
        else:
            # Fallback al modelo disponible
            if self.model_270m:
                model = self.model_270m
                model_name = "270m"
            elif self.model_1b:
                model = self.model_1b
                model_name = "1b"
            else:
                return {
                    "response": "❌ No hay modelos disponibles",
                    "model_used": "none",
                    "error": "No models available"
                }
        
        try:
            # Preparar contexto optimizado
            context = self._prepare_context(user_input, model_name)
            
            # Generar respuesta
            response = model.invoke(context)
            
            # Limpiar respuesta
            response = self._clean_response(response, model_name)
            
            # Verificar si necesita escalamiento
            if model_name == "270m" and self._should_escalate_response(response):
                return self._escalate_to_1b(user_input, response)
            
            return {
                "response": response,
                "model_used": model_name,
                "context_length": len(context),
                "escalated": False
            }
            
        except Exception as e:
            # En caso de error, intentar con el otro modelo
            if model_name == "270m" and self.model_1b:
                return self._escalate_to_1b(user_input, f"Error en 270M: {str(e)}")
            
            return {
                "response": f"❌ Error procesando solicitud: {str(e)}",
                "model_used": model_name,
                "error": str(e)
            }
    
    def _escalate_to_1b(self, user_input: str, previous_response: str = "") -> Dict:
        """Escala la tarea al modelo 1B"""
        
        if not self.model_1b:
            return {
                "response": f"❌ Modelo 1B no disponible. Respuesta 270M: {previous_response}",
                "model_used": "270m",
                "escalation_failed": True
            }
        
        try:
            # Contexto mejorado para 1B
            context = self._prepare_context(user_input, "1b", previous_attempt=previous_response)
            
            response = self.model_1b.invoke(context)
            response = self._clean_response(response, "1b")
            
            return {
                "response": response,
                "model_used": "1b",
                "escalated": True,
                "previous_attempt": previous_response[:100] if previous_response else None
            }
            
        except Exception as e:
            return {
                "response": f"❌ Error en escalamiento: {str(e)}",
                "model_used": "1b",
                "error": str(e),
                "escalation_failed": True
            }
    
    def _prepare_context(self, user_input: str, model_name: str, previous_attempt: str = "") -> str:
        """Prepara el contexto optimizado para cada modelo"""
        
        if model_name == "270m":
            # Contexto simple para modelo ligero
            if previous_attempt:
                return f"Usuario: {user_input}\nIntento anterior falló. Respuesta simple:\nAsistente:"
            else:
                return f"Usuario: {user_input}\nAsistente:"
        
        else:  # 1b
            # Contexto más rico para modelo potente
            context_parts = []
            
            if previous_attempt:
                context_parts.append(f"Intento anterior (270M): {previous_attempt[:100]}")
            
            # Agregar contexto de conversación reciente
            if self.conversation_context:
                recent_context = self.conversation_context[-3:]  # Últimas 3 interacciones
                for ctx in recent_context:
                    context_parts.append(f"{ctx['role']}: {ctx['content'][:50]}")
            
            context_parts.append(f"Usuario: {user_input}")
            context_parts.append("Asistente:")
            
            return "\n".join(context_parts)
    
    def _clean_response(self, response: str, model_name: str) -> str:
        """Limpia y formatea la respuesta del modelo"""
        
        # Remover prefijos del modelo
        response = response.replace(f"[{model_name.upper()}]", "").strip()
        
        # Truncar respuestas muy largas del modelo 270M
        if model_name == "270m" and len(response) > 300:
            response = response[:300] + "..."
        
        # Aplicar restricciones anti-alucinación
        response = anti_hallucination.enforce_approval_language(response)
        
        return response
    
    def _should_escalate_response(self, response: str) -> bool:
        """Determina si una respuesta del 270M necesita escalamiento"""
        
        escalation_indicators = [
            "no estoy seguro",
            "no tengo información",
            "es complejo",
            "necesito más contexto",
            "error",
            len(response) < 20,  # Respuesta muy corta
        ]
        
        response_lower = response.lower()
        return any(indicator in response_lower for indicator in escalation_indicators)
    
    def _update_conversation_context(self, user_input: str, ai_response: str):
        """Actualiza el contexto de conversación"""
        
        self.conversation_context.append({
            "role": "user",
            "content": user_input,
            "timestamp": time.time()
        })
        
        self.conversation_context.append({
            "role": "assistant", 
            "content": ai_response,
            "timestamp": time.time()
        })
        
        # Mantener solo las últimas 10 interacciones
        if len(self.conversation_context) > 20:
            self.conversation_context = self.conversation_context[-20:]
    
    def approve_pending_request(self, request_id: str) -> Dict:
        """Aprueba una solicitud pendiente"""
        
        success = approval_system.approve_request(request_id, "Aprobado por usuario")
        
        if success:
            # Obtener la solicitud del historial
            history = approval_system.get_approval_history(limit=10)
            approved_request = next((r for r in history if r.id == request_id), None)
            
            if approved_request:
                # Ejecutar la tarea aprobada
                recommendation = orchestrator.get_model_recommendation(approved_request.requested_action)
                return self._execute_approved_task(approved_request.requested_action, recommendation)
        
        return {
            "response": "❌ No se pudo aprobar la solicitud",
            "error": "Request not found or already processed"
        }
    
    def deny_pending_request(self, request_id: str, reason: str = "") -> Dict:
        """Deniega una solicitud pendiente"""
        
        success = approval_system.deny_request(request_id, reason)
        
        return {
            "response": f"❌ Solicitud denegada: {reason}" if reason else "❌ Solicitud denegada",
            "approval_denied": True,
            "success": success
        }
    
    def get_system_status(self) -> Dict:
        """Obtiene el estado del sistema"""
        
        return {
            "models": {
                "270m_available": self.model_270m is not None,
                "1b_available": self.model_1b is not None,
                "current_model": "270m" if self.current_model == self.model_270m else "1b"
            },
            "orchestrator": orchestrator.get_performance_stats(),
            "approvals": {
                "pending_requests": len(approval_system.get_pending_requests()),
                "total_history": len(approval_system.get_approval_history())
            },
            "conversation_context_size": len(self.conversation_context)
        }

# Instancia global del agente mejorado
enhanced_agent = EnhancedAgent()