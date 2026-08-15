import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, Shield } from 'lucide-react';

const COLOR_PRESETS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#14b8a6'  // Teal
];

export default function TeamManagerModal({ teams, isOpen, onClose, onAddTeam, onUpdateTeam, onDeleteTeam }) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#6366f1');
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#6366f1');

  if (!isOpen) return null;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    onAddTeam({ name: newTeamName.trim(), color: newTeamColor });
    setNewTeamName('');
  };

  const startEdit = (team) => {
    setEditingTeamId(team.id);
    setEditName(team.name);
    setEditColor(team.color || '#6366f1');
  };

  const saveEdit = (teamId) => {
    if (!editName.trim()) return;
    onUpdateTeam({ id: teamId, name: editName.trim(), color: editColor });
    setEditingTeamId(null);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={24} color="#6366f1" />
            <h2 style={{ fontSize: '1.4rem' }}>Manage Teams</h2>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form to Add New Team */}
        <form onSubmit={handleAddSubmit} style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
            Add New Team Name
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Cyber Warriors"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary">
              <Plus size={18} /> Add
            </button>
          </div>

          {/* Color Presets */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewTeamColor(color)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: newTeamColor === color ? '2px solid #fff' : 'none',
                  cursor: 'pointer',
                  transform: newTeamColor === color ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.15s ease'
                }}
              />
            ))}
          </div>
        </form>

        {/* Existing Teams List */}
        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {teams.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
              No teams added yet. Add a team above!
            </div>
          ) : (
            teams.map((team) => (
              <div
                key={team.id}
                className="glass-card"
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                {editingTeamId === team.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px' }}
                    />
                    <button className="btn btn-success" style={{ padding: '6px 12px' }} onClick={() => saveEdit(team.id)}>
                      <Check size={16} /> Save
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: team.color || '#6366f1',
                        display: 'inline-block'
                      }} />
                      <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{team.name}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px' }}
                        onClick={() => startEdit(team)}
                        title="Rename team"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px' }}
                        onClick={() => onDeleteTeam(team.id)}
                        title="Remove team"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
