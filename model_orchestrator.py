"""
Model Orchestrator - Sistema de orquestación inteligente
270M (rápido) → 1B (potente) según complejidad de la tarea
"""

import re
from typing import Dict, List, Tuple, Optional
from enum import Enum
import json
import time

class TaskComplexity(Enum):
    SIMPLE = "simple"      # 270M puede manejar
    COMPLEX = "complex"    # Necesita 1B
    SYSTEM = "system"      # Acceso al sistema (requiere aprobación)

class ModelOrchestrator:
    def __init__(self):
        self.complexity_patterns = {
            # Tareas simples - 270M
            TaskComplexity.SIMPLE: [
                r"hola|hi|hello|buenos días|buenas tardes",
                r"¿?cómo estás|how are you",
                r"gracias|thank you|thanks",
                r"adiós|bye|goodbye",
                r"¿?qué hora es|what time",
                r"clima|weather|temperatura",
                r"chiste|joke|cuéntame algo",
                r"^(sí|no|ok|vale|bien)$",
            ],
            
            # Tareas complejas - 1B
            TaskComplexity.COMPLEX: [
                r"analiza|analyze|explica|explain",
                r"crea|create|genera|generate|escribe|write",
                r"resuelve|solve|calcula|calculate",
                r"compara|compare|diferencia|difference",
                r"planifica|plan|estrategia|strategy",
                r"código|code|programa|program|script",
                r"traducir|translate|idioma|language",
                r"resumen|summary|resume|sintetiza",
            ],
            
            # Tareas del sistema - Requiere aprobación
            TaskComplexity.SYSTEM: [
                r"abre|open|ejecuta|run|launch",
                r"archivo|file|carpeta|folder|directorio",
                r"instala|install|descarga|download",
                r"elimina|delete|borra|remove",
                r"configura|configure|settings|ajustes",
                r"volumen|volume|sonido|sound",
                r"batería|battery|energía|power",
                r"aplicación|app|programa|software",
            ]
        }
        
        self.task_history = []
        self.performance_metrics = {
            "270m_success_rate": 0.85,
            "1b_success_rate": 0.95,
            "avg_response_time_270m": 0.5,
            "avg_response_time_1b": 2.0
        }

    def analyze_task_complexity(self, user_input: str) -> TaskComplexity:
        """Analiza la complejidad de la tarea basada en patrones"""
        user_input_lower = user_input.lower().strip()
        
        # Verificar patrones del sistema primero (más restrictivo)
        for pattern in self.complexity_patterns[TaskComplexity.SYSTEM]:
            if re.search(pattern, user_input_lower):
                return TaskComplexity.SYSTEM
        
        # Verificar patrones complejos
        for pattern in self.complexity_patterns[TaskComplexity.COMPLEX]:
            if re.search(pattern, user_input_lower):
                return TaskComplexity.COMPLEX
        
        # Verificar patrones simples
        for pattern in self.complexity_patterns[TaskComplexity.SIMPLE]:
            if re.search(pattern, user_input_lower):
                return TaskComplexity.SIMPLE
        
        # Heurísticas adicionales
        word_count = len(user_input.split())
        if word_count > 20:
            return TaskComplexity.COMPLEX
        
        if any(char in user_input for char in ['?', '¿', 'cómo', 'por qué', 'cuál']):
            return TaskComplexity.COMPLEX
        
        # Por defecto, tareas simples para 270M
        return TaskComplexity.SIMPLE

    def should_escalate_to_1b(self, task_complexity: TaskComplexity, 
                             attempt_count: int = 1) -> bool:
        """Decide si escalar de 270M a 1B"""
        
        # Siempre usar 1B para tareas complejas
        if task_complexity == TaskComplexity.COMPLEX:
            return True
        
        # Escalar si 270M ha fallado múltiples veces
        if attempt_count > 2:
            return True
        
        # Considerar métricas de rendimiento
        if self.performance_metrics["270m_success_rate"] < 0.7:
            return True
        
        return False

    def requires_system_approval(self, task_complexity: TaskComplexity) -> bool:
        """Verifica si la tarea requiere aprobación del usuario"""
        return task_complexity == TaskComplexity.SYSTEM

    def get_model_recommendation(self, user_input: str, 
                               context: Dict = None) -> Dict:
        """Obtiene recomendación de modelo y configuración"""
        
        complexity = self.analyze_task_complexity(user_input)
        requires_approval = self.requires_system_approval(complexity)
        
        # Determinar modelo recomendado
        if complexity == TaskComplexity.SIMPLE:
            recommended_model = "270m"
            fallback_model = "1b"
        else:
            recommended_model = "1b"
            fallback_model = None
        
        # Configuración específica por modelo
        model_config = {
            "270m": {
                "max_tokens": 100,
                "temperature": 0.7,
                "timeout": 5
            },
            "1b": {
                "max_tokens": 300,
                "temperature": 0.8,
                "timeout": 15
            }
        }
        
        return {
            "complexity": complexity.value,
            "recommended_model": recommended_model,
            "fallback_model": fallback_model,
            "requires_approval": requires_approval,
            "config": model_config.get(recommended_model, {}),
            "estimated_time": self.performance_metrics.get(f"avg_response_time_{recommended_model}", 1.0)
        }

    def log_task_execution(self, user_input: str, model_used: str, 
                          success: bool, response_time: float):
        """Registra la ejecución de tareas para mejorar predicciones"""
        
        task_log = {
            "timestamp": time.time(),
            "input": user_input[:100],  # Truncar para privacidad
            "model": model_used,
            "success": success,
            "response_time": response_time,
            "complexity": self.analyze_task_complexity(user_input).value
        }
        
        self.task_history.append(task_log)
        
        # Mantener solo los últimos 100 registros
        if len(self.task_history) > 100:
            self.task_history = self.task_history[-100:]
        
        # Actualizar métricas de rendimiento
        self._update_performance_metrics()

    def _update_performance_metrics(self):
        """Actualiza métricas de rendimiento basadas en historial"""
        if not self.task_history:
            return
        
        # Calcular tasas de éxito por modelo
        for model in ["270m", "1b"]:
            model_tasks = [t for t in self.task_history if t["model"] == model]
            if model_tasks:
                success_rate = sum(1 for t in model_tasks if t["success"]) / len(model_tasks)
                avg_time = sum(t["response_time"] for t in model_tasks) / len(model_tasks)
                
                self.performance_metrics[f"{model}_success_rate"] = success_rate
                self.performance_metrics[f"avg_response_time_{model}"] = avg_time

    def get_performance_stats(self) -> Dict:
        """Obtiene estadísticas de rendimiento"""
        return {
            "metrics": self.performance_metrics,
            "total_tasks": len(self.task_history),
            "recent_tasks": self.task_history[-10:] if self.task_history else []
        }

# Instancia global del orquestador
orchestrator = ModelOrchestrator()