import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle, Eye, History } from 'lucide-react';

interface ApprovalRequest {
  id: string;
  task_description: string;
  risk_level: string;
  requested_action: string;
  timestamp: number;
  expires_at: number;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  user_response?: string;
}

export const ApprovalPanel: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovalData();
    const interval = setInterval(fetchApprovalData, 2000); // Actualizar cada 2 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchApprovalData = async () => {
    try {
      const [pendingResponse, historyResponse] = await Promise.all([
        fetch('/api/approvals/pending'),
        fetch('/api/approvals/history')
      ]);
      
      const pending = await pendingResponse.json();
      const history = await historyResponse.json();
      
      setPendingRequests(pending);
      setApprovalHistory(history);
    } catch (error) {
      console.error('Error fetching approval data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch(`/api/approvals/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Aprobado por usuario' })
      });
      
      if (response.ok) {
        fetchApprovalData(); // Refrescar datos
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleDeny = async (requestId: string, reason: string = '') => {
    try {
      const response = await fetch(`/api/approvals/${requestId}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        fetchApprovalData(); // Refrescar datos
      }
    } catch (error) {
      console.error('Error denying request:', error);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-warning-400 bg-warning-500/20 border-warning-500/30';
      case 'low': return 'text-success-400 bg-success-500/20 border-success-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'denied': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'expired': return <Clock className="w-5 h-5 text-gray-400" />;
      default: return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const formatTimeRemaining = (expiresAt: number) => {
    const remaining = Math.max(0, expiresAt - Date.now() / 1000);
    if (remaining <= 0) return 'Expirado';
    
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-success-500/20 rounded-lg">
            <Shield className="w-6 h-6 text-success-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Sistema de Aprobaciones</h2>
        </div>
        
        {pendingRequests.length > 0 && (
          <div className="flex items-center space-x-2 px-3 py-2 glass-card border border-warning-500/30">
            <AlertTriangle className="w-4 h-4 text-warning-400" />
            <span className="text-warning-400 text-sm font-medium">
              {pendingRequests.length} pendiente{pendingRequests.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 glass-card p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 ${
            activeTab === 'pending'
              ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/20 text-primary-300 border border-primary-500/30 shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Pendientes ({pendingRequests.length})</span>
        </button>
        
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/20 text-primary-300 border border-primary-500/30 shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial ({approvalHistory.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'pending' ? (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-xl">
              <div className="p-4 bg-success-500/20 rounded-full w-fit mx-auto mb-4">
                <Shield className="w-12 h-12 text-success-400" />
              </div>
              <p className="text-slate-400">No hay solicitudes pendientes</p>
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div key={request.id} className="glass-card rounded-xl p-6 border border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRiskLevelColor(request.risk_level)}`}>
                        {request.risk_level.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400 font-mono bg-white/5 px-2 py-1 rounded">
                        ID: {request.id}
                      </span>
                    </div>
                    
                    <h3 className="text-white font-semibold mb-3 text-lg">
                      {request.task_description}
                    </h3>
                    
                    <div className="glass-card rounded-lg p-4 mb-4 border border-white/5">
                      <p className="text-sm text-slate-300 font-mono">
                        {request.requested_action}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right ml-6">
                    <div className="flex items-center space-x-2 mb-2 glass-card px-3 py-2 rounded-lg">
                      <Clock className="w-4 h-4 text-primary-400" />
                      <span className="text-sm text-primary-400 font-mono font-semibold">
                        {formatTimeRemaining(request.expires_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatTimestamp(request.timestamp)}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-success-500/20 to-success-600/20 hover:from-success-500/30 hover:to-success-600/30 text-success-300 border border-success-500/30 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-success-500/20"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Aprobar</span>
                  </button>
                  
                  <button
                    onClick={() => handleDeny(request.id, 'Denegado por usuario')}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-300 border border-red-500/30 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
                  >
                    <XCircle className="w-4 h-4" />
                    <span className="font-medium">Denegar</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {approvalHistory.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-xl">
              <div className="p-4 bg-slate-500/20 rounded-full w-fit mx-auto mb-4">
                <History className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-slate-400">No hay historial de aprobaciones</p>
            </div>
          ) : (
            approvalHistory.slice(0, 20).map((request) => (
              <div key={request.id} className="glass-card rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(request.status)}
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getRiskLevelColor(request.risk_level)}`}>
                        {request.risk_level.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400 font-mono bg-white/5 px-2 py-1 rounded">
                        {request.id}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-300 mb-1 font-medium">
                      {request.task_description}
                    </p>
                    
                    {request.user_response && (
                      <p className="text-xs text-slate-400 italic bg-white/5 px-2 py-1 rounded">
                        "{request.user_response}"
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right ml-4">
                    <p className="text-xs text-slate-400 mb-1">
                      {formatTimestamp(request.timestamp)}
                    </p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      request.status === 'approved' ? 'text-success-400 bg-success-500/20' :
                      request.status === 'denied' ? 'text-red-400 bg-red-500/20' :
                      'text-slate-400 bg-slate-500/20'
                    }`}>
                      {request.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};