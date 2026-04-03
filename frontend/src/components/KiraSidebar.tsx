import { useState } from 'react';
import { useChat } from '../context/ChatContext';

export const KiraSidebar = () => {
  const { projects, activeProjectId, setActiveProjectId, fetchProjects } = useChat();
  const [conversationsOpen, setConversationsOpen] = useState(true);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);

  const createProject = async () => {
    const name = prompt('Nombre del proyecto:');
    if (!name) return;
    try {
      const res = await fetch('http://localhost:8000/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) fetchProjects();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="kira-sidebar app-drag-region">
      {/* Header */}
      <div className="kira-sidebar-header">
        <span className="kira-title">Black Chat</span>
      </div>

      {/* Search */}
      <div className="px-[13px] mt-[6px] mb-[2px]">
        <div className="kira-search no-drag">
          <span className="kira-search-icon">⌕</span>
          <span className="kira-search-placeholder">Search</span>
        </div>
      </div>

      {/* Conversaciones */}
      <div className="kira-section no-drag">
        <button className="kira-section-header" onClick={() => setConversationsOpen(!conversationsOpen)}>
          <span className="kira-section-title">Conversaciones</span>
          <span className="kira-chevron">{conversationsOpen ? '⌃' : '⌄'}</span>
        </button>
        {conversationsOpen && (
          <div className="kira-items">
            <div className="kira-item kira-item-active">
              <span className="kira-item-icon">⬜</span>
              <span className="kira-item-label">Title</span>
              <span className="kira-item-detail">Detail</span>
              <span className="kira-item-badge">⬜</span>
            </div>
            <div className="kira-item">
              <span className="kira-item-icon" style={{ color: '#007AFF' }}>⬜</span>
              <span className="kira-item-label">Title</span>
              <span className="kira-item-detail-dim">Detail</span>
              <span className="kira-item-badge">⬜</span>
            </div>
          </div>
        )}
      </div>

      {/* Archivados */}
      <div className="kira-section no-drag">
        <button className="kira-section-header" onClick={() => setArchivedOpen(!archivedOpen)}>
          <span className="kira-section-title">Archivados</span>
          <span className="kira-chevron">{archivedOpen ? '⌃' : '⌄'}</span>
        </button>
      </div>

      {/* Proyectos */}
      <div className="kira-section no-drag flex-1">
        <button className="kira-section-header" onClick={() => setProjectsOpen(!projectsOpen)}>
          <span className="kira-section-title">Proyectos</span>
          <span className="kira-chevron">{projectsOpen ? '⌃' : '⌄'}</span>
        </button>
        {projectsOpen && (
          <div className="kira-items overflow-y-auto max-h-[180px] scrollbar-premium">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                className={`kira-item w-full ${activeProjectId === p.id ? 'kira-item-active' : ''}`}
              >
                <span className="kira-item-icon" style={{ color: '#007AFF' }}>⬜</span>
                <span className="kira-item-label truncate">{p.name}</span>
              </button>
            ))}
            {/* Nuevo Proyecto */}
            <button onClick={createProject} className="kira-add-item">
              <span className="kira-add-icon">⊕</span>
              <span className="kira-add-label">Nuevo proyecto</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
