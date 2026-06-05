import React, { useState } from 'react';
import { Copy, Users, Play } from 'lucide-react';
import { socket } from '../socket';

interface LobbyProps {
  roomId: string;
  myId: string;
  players: {
    id: string;
    name: string;
    isHost: boolean;
    isReady: boolean;
  }[];
  onStartGame: () => void;
  rules: {
    eliminationScore: number;
    cardsPerPlayer: number;
    showThreshold: number;
    penaltyScore: number;
  };
}

export const Lobby: React.FC<LobbyProps> = ({
  roomId,
  myId,
  players,
  onStartGame,
  rules
}) => {
  const [copied, setCopied] = useState(false);
  const [showModify, setShowModify] = useState(false);
  const me = players.find(p => p.id === myId);
  const isHost = me?.isHost || false;
  const canStart = players.length >= 2;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateRule = (key: string, val: number) => {
    socket.emit('updateRules', {
      roomId,
      playerId: myId,
      rules: { [key]: val }
    });
  };

  return (
    <div className="lobby-screen">
      <div className="lobby-card glass-panel">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#34d399' }}>Game Lobby</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Waiting for players to join...</p>
        </div>

        <div className="room-info-badge">
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Room Code
            </span>
            <div className="room-code-display">
              <h3>{roomId}</h3>
              <button 
                className="btn btn-secondary" 
                onClick={copyRoomCode}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                title="Copy Room Code"
              >
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Players
            </span>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
              <Users size={18} />
              {players.length} / 6
            </h3>
          </div>
        </div>

        {/* Gameplay Rules Section */}
        <div style={{ marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isHost ? 'pointer' : 'default' }} onClick={() => isHost && setShowModify(!showModify)}>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#f59e0b', margin: 0 }}>
              ⚙️ Gameplay Rules Settings {isHost && (showModify ? '▲' : '▼')}
            </h4>
            {isHost && (
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                {showModify ? 'Hide settings' : 'Modify Gameplay'}
              </span>
            )}
          </div>

          {isHost && showModify ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🏆 Elimination Score Limit:</label>
                <input 
                  type="number" 
                  min="50" 
                  max="500" 
                  step="10"
                  className="form-input" 
                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                  value={rules.eliminationScore} 
                  onChange={(e) => updateRule('eliminationScore', parseInt(e.target.value) || 200)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🎴 Cards Dealt per Player:</label>
                <input 
                  type="number" 
                  min="3" 
                  max="10" 
                  className="form-input" 
                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                  value={rules.cardsPerPlayer} 
                  onChange={(e) => updateRule('cardsPerPlayer', parseInt(e.target.value) || 7)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🎯 Max Score to Show:</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20" 
                  className="form-input" 
                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                  value={rules.showThreshold} 
                  onChange={(e) => updateRule('showThreshold', parseInt(e.target.value) || 10)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>⚠️ Wrong Show Penalty / Cap:</label>
                <input 
                  type="number" 
                  min="5" 
                  max="50" 
                  className="form-input" 
                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                  value={rules.penaltyScore} 
                  onChange={(e) => updateRule('penaltyScore', parseInt(e.target.value) || 25)}
                />
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div>🏆 Elimination Limit: <strong style={{ color: 'var(--text-primary)' }}>{rules.eliminationScore} pts</strong></div>
              <div>🎴 Starting Cards: <strong style={{ color: 'var(--text-primary)' }}>{rules.cardsPerPlayer} cards</strong></div>
              <div>🎯 Max Score to Show: <strong style={{ color: 'var(--text-primary)' }}>{rules.showThreshold} pts</strong></div>
              <div>⚠️ Wrong Show Penalty / Cap: <strong style={{ color: 'var(--text-primary)' }}>{rules.penaltyScore} pts</strong></div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Player List
          </h4>
          <div className="player-list">
            {players.map((p) => (
              <div key={p.id} className="player-item">
                <div className="player-name-wrapper">
                  <span style={{ fontWeight: p.id === myId ? 600 : 400 }}>
                    {p.name} {p.id === myId && '(You)'}
                  </span>
                  {p.isHost && <span className="host-tag">Host</span>}
                </div>
                <div className="player-status-badge">
                  <div className="status-dot" style={{ backgroundColor: 'var(--primary)' }} />
                  In Lobby
                </div>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <div style={{ textAlign: 'center' }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={onStartGame}
              disabled={!canStart}
            >
              <Play size={16} />
              Start Match
            </button>
            {!canStart && (
              <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.5rem' }}>
                Need at least 2 players to start the game!
              </p>
            )}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(0,0,0,0.1)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Only the host can start the game.
            </p>
          </div>
        )}

        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#f59e0b', marginBottom: '0.5rem' }}>
            Rule Reminders:
          </h4>
          <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.5' }}>
            <li>You start with {rules.cardsPerPlayer} cards.</li>
            <li>You must **Discard First** and then **Draw Next**.</li>
            <li>Discard multiple cards only if they are the exact same rank.</li>
            <li>**Skip Draw Rule:** If you discard cards matching the rank of the top card of the Discard Pile, you do not draw!</li>
            <li>Show threshold: **{rules.showThreshold} points or less**. Wrong show penalty: **+{rules.penaltyScore} points** (round scores are capped at this amount).</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
