import React, { useState, useEffect } from 'react';
import { Brain, Zap, Shield, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ModelStatus {
  '270m_available': boolean;
  '1b_available': boolean;
  current_model: string;
}

interface PerformanceMetrics {
  '270m_success_rate': number;
  '1b_success_rate': number;
  avg_response_time_270m: number;
  avg_response_time_1b: number;
}

interface SystemStatus {
  models: ModelStatus;
  orchestrator: {
    metrics: PerformanceMetrics;
    total_tasks: number;
    recent_tasks: Array<{
      model: string;
      success: boolean;
      response_time: number;
      complexity: string;
    }>;
  };
  approvals: {
    pending_requests: number;
    total_history: number;
  };
}

export const ModelOrchestrator: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/system/status');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Error fetching system status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!systemStatus) {
    return (
      <div className="p-4 text-red-400">
        Error cargando estado del sistema
      </div>
    );
  }

  const getModelStatusIcon = (available: boolean) => {
    return available ? (
      <CheckCircle className="w-5 h-5 text-green-400" />
    ) : (
      <XCircle className="w-5 h-5 text-red-400" />
    );
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.9) return 'text-green-400';
    if (rate >= 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Brain className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Orquestador de Modelos</h2>
      </div>

      {/* Model Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-white flex items-center">
              <Zap className="w-5 h-5 text-yellow-400 mr-2" />
              Modelo 270M
            </h3>
            {getModelStatusIcon(systemStatus.models['270m_available'])}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Tasa de éxito:</span>
              <span className={getSuccessRateColor(systemStatus.orchestrator.metrics['270m_success_rate'])}>
                {(systemStatus.orchestrator.metrics['270m_success_rate'] * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tiempo promedio:</span>
              <span className="text-blue-400">
                {systemStatus.orchestrator.metrics.avg_response_time_270m.toFixed(1)}s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Uso:</span>
              <span className="text-green-400">Tareas simples</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-white flex items-center">
              <Brain className="w-5 h-5 text-purple-400 mr-2" />
              Modelo 1B
            </h3>
            {getModelStatusIcon(systemStatus.models['1b_available'])}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Tasa de éxito:</span>
              <span className={getSuccessRateColor(systemStatus.orchestrator.metrics['1b_success_rate'])}>
                {(systemStatus.orchestrator.metrics['1b_success_rate'] * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tiempo promedio:</span>
              <span className="text-blue-400">
                {systemStatus.orchestrator.metrics.avg_response_time_1b.toFixed(1)}s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Uso:</span>
              <span className="text-purple-400">Tareas complejas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Model Indicator */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">Modelo Activo:</span>
          </div>
          <div className="flex items-center space-x-2">
            {systemStatus.models.current_model === '270m' ? (
              <Zap className="w-5 h-5 text-yellow-400" />
            ) : (
              <Brain className="w-5 h-5 text-purple-400" />
            )}
            <span className="text-blue-400 font-mono">
              {systemStatus.models.current_model.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Approval System Status */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-white flex items-center">
            <Shield className="w-5 h-5 text-green-400 mr-2" />
            Sistema de Aprobaciones
          </h3>
          {systemStatus.approvals.pending_requests > 0 && (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-medium">
                {systemStatus.approvals.pending_requests} pendiente(s)
              </span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Solicitudes pendientes:</span>
            <span className="text-yellow-400 font-medium">
              {systemStatus.approvals.pending_requests}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total procesadas:</span>
            <span className="text-blue-400">
              {systemStatus.approvals.total_history}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-3 flex items-center">
          <Clock className="w-5 h-5 text-blue-400 mr-2" />
          Tareas Recientes
        </h3>
        
        <div className="space-y-2">
          {systemStatus.orchestrator.recent_tasks.slice(0, 5).map((task, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
              <div className="flex items-center space-x-3">
                {task.model === '270m' ? (
                  <Zap className="w-4 h-4 text-yellow-400" />
                ) : (
                  <Brain className="w-4 h-4 text-purple-400" />
                )}
                <span className="text-sm text-gray-300 font-mono">
                  {task.model.toUpperCase()}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  task.complexity === 'simple' ? 'bg-green-900 text-green-300' :
                  task.complexity === 'complex' ? 'bg-purple-900 text-purple-300' :
                  'bg-red-900 text-red-300'
                }`}>
                  {task.complexity}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-400">
                  {task.response_time.toFixed(2)}s
                </span>
                {task.success ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-3">Resumen de Rendimiento</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-gray-700/30 rounded">
            <div className="text-2xl font-bold text-blue-400">
              {systemStatus.orchestrator.total_tasks}
            </div>
            <div className="text-sm text-gray-400">Tareas Totales</div>
          </div>
          
          <div className="p-3 bg-gray-700/30 rounded">
            <div className="text-2xl font-bold text-green-400">
              {((systemStatus.orchestrator.metrics['270m_success_rate'] + 
                 systemStatus.orchestrator.metrics['1b_success_rate']) / 2 * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Éxito Promedio</div>
          </div>
          
          <div className="p-3 bg-gray-700/30 rounded">
            <div className="text-2xl font-bold text-purple-400">
              {((systemStatus.orchestrator.metrics.avg_response_time_270m + 
                 systemStatus.orchestrator.metrics.avg_response_time_1b) / 2).toFixed(1)}s
            </div>
            <div className="text-sm text-gray-400">Tiempo Promedio</div>
          </div>
        </div>
      </div>
    </div>
  );
};