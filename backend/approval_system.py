"""
Sistema de Aprobaciones - Control de acceso al sistema
Requiere aprobación explícita para tareas del sistema
"""

import time
import json
from typing import Dict, List, Optional, Callable
from enum import Enum
from dataclasses import dataclass
import threading
import queue

class ApprovalStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    EXPIRED = "expired"

@dataclass
class ApprovalRequest:
    id: str
    task_description: str
    risk_level: str
    requested_action: str
    timestamp: float
    expires_at: float
    status: ApprovalStatus = ApprovalStatus.PENDING
    user_response: Optional[str] = None

class ApprovalSystem:
    def __init__(self, default_timeout: int = 30):
        self.default_timeout = default_timeout
        self.pending_requests: Dict[str, ApprovalRequest] = {}
        self.approval_history: List[ApprovalRequest] = []
        self.auto_approve_patterns: List[str] = []
        self.auto_deny_patterns: List[str] = [
            r"elimina|delete|borra.*sistema",
            r"formatea|format.*disco",
            r"sudo.*rm.*-rf",
            r"instala.*virus|malware",
        ]
        
        # Queue para comunicación con UI
        self.approval_queue = queue.Queue()
        self.response_queue = queue.Queue()
        
        # Callbacks para UI
        self.on_approval_request: Optional[Callable] = None
        self.on_approval_response: Optional[Callable] = None

    def request_approval(self, task_description: str, 
                        requested_action: str,
                        risk_level: str = "medium") -> ApprovalRequest:
        """Solicita aprobación para una tarea del sistema"""
        
        request_id = f"req_{int(time.time() * 1000)}"
        expires_at = time.time() + self.default_timeout
        
        request = ApprovalRequest(
            id=request_id,
            task_description=task_description,
            risk_level=risk_level,
            requested_action=requested_action,
            timestamp=time.time(),
            expires_at=expires_at
        )
        
        # Verificar patrones de auto-denegación
        if self._should_auto_deny(requested_action):
            request.status = ApprovalStatus.DENIED
            request.user_response = "Auto-denegado por seguridad"
            self.approval_history.append(request)
            return request
        
        # Verificar patrones de auto-aprobación
        if self._should_auto_approve(requested_action):
            request.status = ApprovalStatus.APPROVED
            request.user_response = "Auto-aprobado"
            self.approval_history.append(request)
            return request
        
        # Agregar a solicitudes pendientes
        self.pending_requests[request_id] = request
        
        # Notificar a la UI
        if self.on_approval_request:
            self.on_approval_request(request)
        
        # Agregar a queue para procesamiento
        self.approval_queue.put(request)
        
        return request

    def wait_for_approval(self, request_id: str, timeout: Optional[int] = None) -> ApprovalStatus:
        """Espera por la aprobación de una solicitud"""
        
        if request_id not in self.pending_requests:
            return ApprovalStatus.DENIED
        
        request = self.pending_requests[request_id]
        timeout = timeout or self.default_timeout
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            # Verificar si ya fue respondida
            if request.status != ApprovalStatus.PENDING:
                break
            
            # Verificar si expiró
            if time.time() > request.expires_at:
                request.status = ApprovalStatus.EXPIRED
                break
            
            time.sleep(0.1)  # Polling cada 100ms
        
        # Limpiar solicitud pendiente
        if request_id in self.pending_requests:
            del self.pending_requests[request_id]
        
        # Agregar al historial
        self.approval_history.append(request)
        
        return request.status

    def approve_request(self, request_id: str, user_response: str = "") -> bool:
        """Aprueba una solicitud pendiente"""
        
        if request_id not in self.pending_requests:
            return False
        
        request = self.pending_requests[request_id]
        request.status = ApprovalStatus.APPROVED
        request.user_response = user_response
        
        if self.on_approval_response:
            self.on_approval_response(request)
        
        return True

    def deny_request(self, request_id: str, user_response: str = "") -> bool:
        """Deniega una solicitud pendiente"""
        
        if request_id not in self.pending_requests:
            return False
        
        request = self.pending_requests[request_id]
        request.status = ApprovalStatus.DENIED
        request.user_response = user_response
        
        if self.on_approval_response:
            self.on_approval_response(request)
        
        return True

    def get_pending_requests(self) -> List[ApprovalRequest]:
        """Obtiene todas las solicitudes pendientes"""
        return list(self.pending_requests.values())

    def get_approval_history(self, limit: int = 50) -> List[ApprovalRequest]:
        """Obtiene el historial de aprobaciones"""
        return self.approval_history[-limit:]

    def _should_auto_approve(self, action: str) -> bool:
        """Verifica si una acción debe ser auto-aprobada"""
        import re
        action_lower = action.lower()
        
        for pattern in self.auto_approve_patterns:
            if re.search(pattern, action_lower):
                return True
        return False

    def _should_auto_deny(self, action: str) -> bool:
        """Verifica si una acción debe ser auto-denegada"""
        import re
        action_lower = action.lower()
        
        for pattern in self.auto_deny_patterns:
            if re.search(pattern, action_lower):
                return True
        return False

    def add_auto_approve_pattern(self, pattern: str):
        """Agrega un patrón de auto-aprobación"""
        self.auto_approve_patterns.append(pattern)

    def add_auto_deny_pattern(self, pattern: str):
        """Agrega un patrón de auto-denegación"""
        self.auto_deny_patterns.append(pattern)

    def get_risk_assessment(self, action: str) -> Dict:
        """Evalúa el riesgo de una acción"""
        
        risk_indicators = {
            "high": [
                r"elimina|delete|borra",
                r"formatea|format",
                r"sudo|admin",
                r"sistema|system|root",
                r"instala|install.*exe|dmg",
            ],
            "medium": [
                r"abre|open.*aplicación",
                r"configura|configure",
                r"descarga|download",
                r"ejecuta|run.*script",
            ],
            "low": [
                r"volumen|volume",
                r"batería|battery",
                r"hora|time|fecha|date",
                r"clima|weather",
            ]
        }
        
        import re
        action_lower = action.lower()
        
        for risk_level, patterns in risk_indicators.items():
            for pattern in patterns:
                if re.search(pattern, action_lower):
                    return {
                        "level": risk_level,
                        "reason": f"Coincide con patrón: {pattern}",
                        "requires_approval": risk_level in ["high", "medium"]
                    }
        
        return {
            "level": "unknown",
            "reason": "No se pudo determinar el riesgo",
            "requires_approval": True
        }

    def cleanup_expired_requests(self):
        """Limpia solicitudes expiradas"""
        current_time = time.time()
        expired_ids = []
        
        for request_id, request in self.pending_requests.items():
            if current_time > request.expires_at:
                request.status = ApprovalStatus.EXPIRED
                expired_ids.append(request_id)
                self.approval_history.append(request)
        
        for request_id in expired_ids:
            del self.pending_requests[request_id]
        
        return len(expired_ids)

# Instancia global del sistema de aprobaciones
approval_system = ApprovalSystem()