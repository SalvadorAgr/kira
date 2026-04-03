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
      <div className="p-1 bg-success-500/20 rounded-full">
        <CheckCircle className="w-5 h-5 text-success-400" />
      </div>
    ) : (
      <div className="p-1 bg-red-500/20 rounded-full">
        <XCircle className="w-5 h-5 text-red-400" />
      </div>
    );
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.9) return 'text-success-400';
    if (rate >= 0.7) return 'text-warning-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary-500/20 rounded-lg">
          <Brain className="w-6 h-6 text-primary-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">Orquestador de Modelos</h2>
      </div>

      {/* Model Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <div className="p-2 bg-warning-500/20 rounded-lg mr-3">
                <Zap className="w-5 h-5 text-warning-400" />
              </div>
              Modelo 270M
            </h3>
            <div className="p-1 rounded-full">
              {getModelStatusIcon(systemStatus.models['270m_available'])}
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 glass-card rounded-lg">
              <span className="text-slate-400">Tasa de éxito:</span>
              <span className={`font-semibold ${getSuccessRateColor(systemStatus.orchestrator.metrics['270m_success_rate'])}`}>
                {(systemStatus.orchestrator.metrics['270m_success_rate'] * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 glass-card rounded-lg">
              <span className="text-slate-400">Tiempo promedio:</span>
              <span className="text-primary-400 font-semibold">
                {systemStatus.orchestrator.metrics.avg_response_time_270m.toFixed(1)}s
              </span>
            </div>
            <div className="flex justify-between items-center p-3 glass-card rounded-lg">
              <span className="text-slate-400">Uso:</span>
              <span className="text-success-400 font-semibold">Tareas simples</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <div className="p-2 bg-accent-500/20 rounded-lg mr-3">
                <Brain className="w-5 h-5 text-accent-400" />
              </div>
              Modelo 1B
            </h3>
            <div className="p-1 rounded-full">
              {getModelStatusIcon(systemStatus.models['1b_available'])}
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 glass-card rounded-lg">
              <span className="text-slate-400">Tasa de éxito:</span>
              <span className={`font-semibold ${getSuccessRateColor(systemStatus.orchestrator.metrics['1b_success_rate'])}`}>
                {(systemStatus.orchestrator.metrics['1b_success_rate'] * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 glass-card rounded-lg">
              <span className="text-slate-400">Tiempo promedio:</span>
              <span className="text-primary-400 font-semibold">
                {systemStatus.orchestrator.metrics.avg_response_time_1b.toFixed(1)}s
              </span>
            </div>
            <div className="flex justify-between items-center p-3 glass-card rounded-lg">
              <span className="text-slate-400">Uso:</span>
              <span className="text-accent-400 font-semibold">Tareas complejas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Model Indicator */}
      <div className="glass-card rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-success-400 rounded-full animate-pulse shadow-lg shadow-success-400/50"></div>
            <span className="text-white font-semibold text-lg">Modelo Activo:</span>
          </div>
          <div className="flex items-center space-x-3 glass-card px-4 py-2 rounded-lg">
            <div className={`p-2 rounded-lg ${
              systemStatus.models.current_model === '270m' 
                ? 'bg-warning-500/20' 
                : 'bg-accent-500/20'
            }`}>
              {systemStatus.models.current_model === '270m' ? (
                <Zap className="w-5 h-5 text-warning-400" />
              ) : (
                <Brain className="w-5 h-5 text-accent-400" />
              )}
            </div>
            <span className="text-primary-400 font-mono font-bold text-lg">
              {systemStatus.models.current_model.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Approval System Status */}
      <div className="glass-card rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <div className="p-2 bg-success-500/20 rounded-lg mr-3">
              <Shield className="w-5 h-5 text-success-400" />
            </div>
            Sistema de Aprobaciones
          </h3>
          {systemStatus.approvals.pending_requests > 0 && (
            <div className="flex items-center space-x-2 glass-card px-3 py-2 rounded-lg border border-warning-500/30">
              <AlertTriangle className="w-5 h-5 text-warning-400" />
              <span className="text-warning-400 font-semibold">
                {systemStatus.approvals.pending_requests} pendiente(s)
              </span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between items-center p-3 glass-card rounded-lg">
            <span className="text-slate-400">Solicitudes pendientes:</span>
            <span className="text-warning-400 font-semibold">
              {systemStatus.approvals.pending_requests}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 glass-card rounded-lg">
            <span className="text-slate-400">Total procesadas:</span>
            <span className="text-primary-400 font-semibold">
              {systemStatus.approvals.total_history}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="glass-card rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <div className="p-2 bg-primary-500/20 rounded-lg mr-3">
            <Clock className="w-5 h-5 text-primary-400" />
          </div>
          Tareas Recientes
        </h3>
        
        <div className="space-y-3">
          {systemStatus.orchestrator.recent_tasks.slice(0, 5).map((task, index) => (
            <div key={index} className="flex items-center justify-between p-4 glass-card rounded-lg border border-white/5">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${
                  task.model === '270m' ? 'bg-warning-500/20' : 'bg-accent-500/20'
                }`}>
                  {task.model === '270m' ? (
                    <Zap className="w-4 h-4 text-warning-400" />
                  ) : (
                    <Brain className="w-4 h-4 text-accent-400" />
                  )}
                </div>
                <span className="text-sm text-slate-300 font-mono font-semibold">
                  {task.model.toUpperCase()}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  task.complexity === 'simple' ? 'bg-success-500/20 text-success-300 border border-success-500/30' :
                  task.complexity === 'complex' ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30' :
                  'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {task.complexity}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-xs text-slate-400 font-mono bg-white/5 px-2 py-1 rounded">
                  {task.response_time.toFixed(2)}s
                </span>
                <div className="p-1 rounded-full">
                  {task.success ? (
                    <CheckCircle className="w-4 h-4 text-success-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="glass-card rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-6">Resumen de Rendimiento</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="glass-card p-6 rounded-xl border border-white/5">
            <div className="text-3xl font-bold text-primary-400 mb-2">
              {systemStatus.orchestrator.total_tasks}
            </div>
            <div className="text-sm text-slate-400 font-medium">Tareas Totales</div>
          </div>
          
          <div className="glass-card p-6 rounded-xl border border-white/5">
            <div className="text-3xl font-bold text-success-400 mb-2">
              {((systemStatus.orchestrator.metrics['270m_success_rate'] + 
                 systemStatus.orchestrator.metrics['1b_success_rate']) / 2 * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-slate-400 font-medium">Éxito Promedio</div>
          </div>
          
          <div className="glass-card p-6 rounded-xl border border-white/5">
            <div className="text-3xl font-bold text-accent-400 mb-2">
              {((systemStatus.orchestrator.metrics.avg_response_time_270m + 
                 systemStatus.orchestrator.metrics.avg_response_time_1b) / 2).toFixed(1)}s
            </div>
            <div className="text-sm text-slate-400 font-medium">Tiempo Promedio</div>
          </div>
        </div>
      </div>
    </div>
  );
};