"""
Sistema Anti-Alucinación - Previene respuestas inventadas o fuera de contexto
Similar a las restricciones aplicadas a Claude
"""

import re
from typing import Dict, List, Optional, Tuple
from enum import Enum
import json

class ResponseValidation(Enum):
    VALID = "valid"
    HALLUCINATION = "hallucination"
    OFF_TOPIC = "off_topic"
    UNSAFE = "unsafe"
    RESTRICTED = "restricted"

class AntiHallucinationSystem:
    def __init__(self):
        # Patrones que indican alucinaciones
        self.hallucination_patterns = [
            r"según mis datos.*\d{4}",  # Fechas específicas inventadas
            r"en mi base de datos",      # Referencias a datos inexistentes
            r"he verificado que",        # Afirmaciones no verificables
            r"está confirmado que",      # Certezas inventadas
            r"los expertos dicen",       # Autoridades inventadas
            r"estudios recientes muestran", # Estudios inexistentes
        ]
        
        # Patrones de respuestas fuera de contexto
        self.off_topic_patterns = [
            r"cambiando de tema",
            r"por cierto",
            r"aprovecho para mencionar",
            r"también quería decirte",
        ]
        
        # Patrones de contenido no seguro
        self.unsafe_patterns = [
            r"hackear|hack|crackear",
            r"piratear|piracy|torrent",
            r"drogas|drugs|narcóticos",
            r"armas|weapons|explosivos",
            r"virus|malware|trojan",
        ]
        
        # Patrones de acciones restringidas
        self.restricted_patterns = [
            r"voy a (ejecutar|correr|instalar)",
            r"he (creado|eliminado|modificado)",
            r"acabo de (hacer|cambiar|actualizar)",
            r"ya (instalé|configuré|ejecuté)",
        ]
        
        # Frases que debe usar para incertidumbre
        self.uncertainty_phrases = [
            "No estoy seguro",
            "Podría ser que",
            "Es posible que",
            "Necesitaría verificar",
            "No tengo información suficiente",
        ]
        
        # Contexto permitido
        self.allowed_topics = [
            "conversación general",
            "tareas del sistema con aprobación",
            "información sobre archivos locales",
            "configuración del sistema",
            "ayuda con aplicaciones",
        ]

    def validate_response(self, user_input: str, ai_response: str, 
                         context: Dict = None) -> Tuple[ResponseValidation, str]:
        """Valida una respuesta del AI antes de enviarla al usuario"""
        
        # Verificar alucinaciones
        hallucination_check = self._check_hallucinations(ai_response)
        if hallucination_check[0]:
            return ResponseValidation.HALLUCINATION, hallucination_check[1]
        
        # Verificar contenido fuera de tema
        off_topic_check = self._check_off_topic(user_input, ai_response)
        if off_topic_check[0]:
            return ResponseValidation.OFF_TOPIC, off_topic_check[1]
        
        # Verificar contenido no seguro
        unsafe_check = self._check_unsafe_content(ai_response)
        if unsafe_check[0]:
            return ResponseValidation.UNSAFE, unsafe_check[1]
        
        # Verificar acciones restringidas
        restricted_check = self._check_restricted_actions(ai_response)
        if restricted_check[0]:
            return ResponseValidation.RESTRICTED, restricted_check[1]
        
        return ResponseValidation.VALID, "Respuesta válida"

    def _check_hallucinations(self, response: str) -> Tuple[bool, str]:
        """Detecta posibles alucinaciones en la respuesta"""
        
        response_lower = response.lower()
        
        for pattern in self.hallucination_patterns:
            if re.search(pattern, response_lower):
                return True, f"Posible alucinación detectada: {pattern}"
        
        # Verificar afirmaciones muy específicas sin contexto
        specific_claims = [
            r"\d{1,2} de \w+ de \d{4}",  # Fechas específicas
            r"\d+\.\d+% de",             # Porcentajes específicos
            r"exactamente \d+",          # Números exactos
            r"según el artículo \d+",    # Referencias específicas
        ]
        
        for pattern in specific_claims:
            if re.search(pattern, response_lower):
                return True, f"Afirmación específica sin verificar: {pattern}"
        
        return False, ""

    def _check_off_topic(self, user_input: str, response: str) -> Tuple[bool, str]:
        """Verifica si la respuesta está fuera del tema solicitado"""
        
        response_lower = response.lower()
        
        for pattern in self.off_topic_patterns:
            if re.search(pattern, response_lower):
                return True, f"Respuesta fuera de tema: {pattern}"
        
        # Verificar longitud desproporcionada
        input_words = len(user_input.split())
        response_words = len(response.split())
        
        if input_words < 10 and response_words > 200:
            return True, "Respuesta desproporcionadamente larga para la pregunta"
        
        return False, ""

    def _check_unsafe_content(self, response: str) -> Tuple[bool, str]:
        """Detecta contenido potencialmente no seguro"""
        
        response_lower = response.lower()
        
        for pattern in self.unsafe_patterns:
            if re.search(pattern, response_lower):
                return True, f"Contenido no seguro detectado: {pattern}"
        
        return False, ""

    def _check_restricted_actions(self, response: str) -> Tuple[bool, str]:
        """Detecta afirmaciones de acciones ya realizadas sin aprobación"""
        
        response_lower = response.lower()
        
        for pattern in self.restricted_patterns:
            if re.search(pattern, response_lower):
                return True, f"Acción restringida mencionada: {pattern}"
        
        return False, ""

    def sanitize_response(self, response: str, validation_result: ResponseValidation) -> str:
        """Sanitiza una respuesta problemática"""
        
        if validation_result == ResponseValidation.HALLUCINATION:
            return "No tengo información verificada sobre eso. ¿Podrías ser más específico sobre lo que necesitas?"
        
        elif validation_result == ResponseValidation.OFF_TOPIC:
            return "Me estoy desviando del tema. ¿Podrías repetir tu pregunta para enfocarme mejor?"
        
        elif validation_result == ResponseValidation.UNSAFE:
            return "No puedo ayudar con ese tipo de contenido. ¿Hay algo más en lo que pueda asistirte?"
        
        elif validation_result == ResponseValidation.RESTRICTED:
            return "No puedo realizar acciones sin tu aprobación previa. ¿Te gustaría que solicite permiso para hacer algo específico?"
        
        return response

    def add_uncertainty_if_needed(self, response: str, confidence_level: float = 0.8) -> str:
        """Agrega frases de incertidumbre si la confianza es baja"""
        
        if confidence_level < 0.8:
            uncertainty_phrase = "No estoy completamente seguro, pero "
            if not response.lower().startswith(("no estoy", "podría", "es posible")):
                response = uncertainty_phrase + response.lower()
        
        return response

    def enforce_approval_language(self, response: str) -> str:
        """Asegura que las acciones del sistema requieran aprobación"""
        
        action_verbs = [
            r"(voy a|puedo|podría) (abrir|ejecutar|instalar|configurar|cambiar)",
            r"(necesito|debo) (acceder|modificar|crear|eliminar)",
        ]
        
        for pattern in action_verbs:
            if re.search(pattern, response.lower()):
                response = re.sub(
                    pattern, 
                    r"¿Te gustaría que \2? Necesito tu aprobación para", 
                    response, 
                    flags=re.IGNORECASE
                )
        
        return response

    def get_safe_response_template(self, task_type: str) -> str:
        """Obtiene una plantilla de respuesta segura según el tipo de tarea"""
        
        templates = {
            "system_action": "Para {action}, necesito tu aprobación. ¿Procedo?",
            "information": "Basándome en la información disponible, {info}. ¿Es esto lo que buscabas?",
            "uncertainty": "No tengo información suficiente sobre {topic}. ¿Podrías proporcionar más detalles?",
            "error": "No pude completar {task}. ¿Quieres que lo intente de otra manera?",
        }
        
        return templates.get(task_type, "¿Cómo puedo ayudarte mejor con esto?")

    def log_validation_result(self, user_input: str, response: str, 
                            validation: ResponseValidation, reason: str):
        """Registra resultados de validación para mejorar el sistema"""
        
        log_entry = {
            "timestamp": time.time(),
            "input_preview": user_input[:50],
            "response_preview": response[:50],
            "validation": validation.value,
            "reason": reason
        }
        
        # En una implementación real, esto se guardaría en base de datos
        print(f"[VALIDATION] {validation.value}: {reason}")

# Instancia global del sistema anti-alucinación
anti_hallucination = AntiHallucinationSystem()