import React, { useState } from 'react';
import { Card } from './Card';
import type { Card as CardType, ClientGameState } from '../../../server/src/types';
import { AlertCircle, BookOpen, X } from 'lucide-react';

interface GameBoardProps {
  gameState: ClientGameState;
  onDiscard: (cardIds: string[]) => void;
  onDraw: (source: 'drawPile' | 'discardPile') => void;
  onDeclareShow: () => void;
  onLeave: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onDiscard,
  onDraw,
  onDeclareShow,
  onLeave
}) => {
  const {
    myId,
    players,
    myHand,
    currentTurnId,
    turnPhase,
    prevTopDiscardCard,
    currentTurnDiscards,
    drawPileCount,
    roundNumber,
    history
  } = gameState;

  // Selected cards state
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  // Ordered hand state for drag-and-drop
  const [orderedHand, setOrderedHand] = useState<CardType[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Rules modal state
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Sync orderedHand with myHand when myHand changes
  React.useEffect(() => {
    setOrderedHand(prev => {
      const myHandMap = new Map(myHand.map(c => [c.id, c]));
      const updatedOrder = prev.filter(c => myHandMap.has(c.id));
      const orderedIds = new Set(updatedOrder.map(c => c.id));
      const newCards = myHand.filter(c => !orderedIds.has(c.id));
      const finalHand = [...updatedOrder, ...newCards];
      return finalHand.map(c => myHandMap.get(c.id)!);
    });
  }, [myHand]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    setOrderedHand(prev => {
      const result = [...prev];
      const [removed] = result.splice(draggedIndex, 1);
      result.splice(targetIndex, 0, removed);
      return result;
    });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Find myself
  const isMyTurn = currentTurnId === myId;

  // Calculate my hand value
  const myHandValue = myHand.reduce((sum, c) => sum + c.value, 0);

  // Filter out myself to get list of opponents
  const opponents = players.filter(p => p.id !== myId);

  // Position coordinates for opponents based on count
  const getOpponentStyle = (index: number, totalOpponents: number) => {
    // We place players in a semi-circular arc around the top and sides of the board
    if (totalOpponents === 1) {
      return { top: '15%', left: '50%' };
    }
    if (totalOpponents === 2) {
      return [
        { top: '25%', left: '15%' },
        { top: '25%', left: '85%' }
      ][index];
    }
    if (totalOpponents === 3) {
      return [
        { top: '45%', left: '12%' },
        { top: '15%', left: '50%' },
        { top: '45%', left: '88%' }
      ][index];
    }
    if (totalOpponents === 4) {
      return [
        { top: '50%', left: '12%' },
        { top: '20%', left: '25%' },
        { top: '20%', left: '75%' },
        { top: '50%', left: '88%' }
      ][index];
    }
    // For 5 opponents
    return [
      { top: '50%', left: '10%' },
      { top: '25%', left: '25%' },
      { top: '15%', left: '50%' },
      { top: '25%', left: '75%' },
      { top: '50%', left: '90%' }
    ][index];
  };

  const handleCardClick = (cardId: string) => {
    if (!isMyTurn || turnPhase !== 'DISCARD') return;

    setSelectedCardIds(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else {
        // If selecting a new card, check if it matches the rank of already selected cards
        const clickedCard = myHand.find(c => c.id === cardId);
        if (prev.length > 0 && clickedCard) {
          const firstSelected = myHand.find(c => c.id === prev[0]);
          if (firstSelected && clickedCard.rank !== firstSelected.rank) {
            // Rank mismatch: clear previous selection and select only the new one
            return [cardId];
          }
        }
        return [...prev, cardId];
      }
    });
  };

  const handleDiscardClick = () => {
    if (selectedCardIds.length === 0) return;
    onDiscard(selectedCardIds);
    setSelectedCardIds([]);
  };

  const handleDrawClick = (source: 'drawPile' | 'discardPile') => {
    if (!isMyTurn || turnPhase !== 'DRAW') return;
    onDraw(source);
  };

  const handleShowClick = () => {
    if (!isMyTurn || turnPhase !== 'DISCARD' || myHandValue > 10) return;
    onDeclareShow();
  };

  // Check if selection is valid for discard
  const selectedCards = myHand.filter(c => selectedCardIds.includes(c.id));
  const isSelectionValid = selectedCards.length > 0 && selectedCards.every(c => c.rank === selectedCards[0].rank);

  return (
    <div className="game-table-container">
      {/* Game Board (Left) */}
      <div className="game-area">
        {/* Top Info Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div className="status-indicator connected">
            <div className="status-dot" />
            <span>Round {roundNumber}</span>
          </div>
          
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {isMyTurn ? (
              <span style={{ color: '#34d399', fontWeight: 600 }}>
                🟢 Your Turn: {turnPhase === 'DISCARD' ? 'Discard a card (or same rank cards)' : 'Draw 1 card'}
              </span>
            ) : (
              <span>
                ⌛ Waiting for {players.find(p => p.id === currentTurnId)?.name || 'opponent'}...
              </span>
            )}
          </div>

          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={onLeave}>
            Quit
          </button>
        </div>

        {/* The Felt Table */}
        <div className="game-board">
          {/* Opponents circle */}
          <div className="opponents-ring">
            {opponents.map((opponent, idx) => {
              const posStyle = getOpponentStyle(idx, opponents.length);
              const isOpponentTurn = opponent.id === currentTurnId;
              return (
                <div 
                  key={opponent.id} 
                  className="opponent-slot" 
                  style={posStyle}
                >
                  <div className={`opponent-card ${isOpponentTurn ? 'active-turn' : ''}`}>
                    <div className="opponent-avatar" style={{ backgroundColor: isOpponentTurn ? 'var(--primary)' : '#475569' }}>
                      {opponent.name[0].toUpperCase()}
                    </div>
                    <div className="opponent-info">
                      <h4>{opponent.name}</h4>
                      <p>{opponent.cardCount} cards | {opponent.score} pts</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Table (Piles) */}
          <div className="center-table">
            {/* Draw Pile */}
            <div className="pile-container">
              <span className="pile-title">Draw</span>
              <div 
                className={`pile-box ${isMyTurn && turnPhase === 'DRAW' ? 'active-pile' : ''}`}
                onClick={() => handleDrawClick('drawPile')}
                style={{ cursor: isMyTurn && turnPhase === 'DRAW' ? 'pointer' : 'not-allowed' }}
              >
                {drawPileCount > 0 ? (
                  <div className="card-wrapper" style={{ pointerEvents: 'none' }}>
                    <div className="card-inner" style={{ transform: 'rotateY(180deg)' }}>
                      <div className="card-face card-back" style={{ borderColor: '#60a5fa' }}>
                        <div className="card-back-pattern" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reshuffle</span>
                )}
                <div className="pile-card-count">{drawPileCount}</div>
              </div>
            </div>

            {/* Discard Pile */}
            <div className="pile-container">
              <span className="pile-title">Discard Pile</span>
              <div 
                className={`pile-box ${isMyTurn && turnPhase === 'DRAW' ? 'active-pile' : ''}`}
                onClick={() => handleDrawClick('discardPile')}
                style={{ cursor: isMyTurn && turnPhase === 'DRAW' ? 'pointer' : 'not-allowed' }}
              >
                {prevTopDiscardCard ? (
                  <Card card={prevTopDiscardCard} disabled={true} />
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Empty</span>
                )}
              </div>
            </div>

            {/* Current Turn Discards (Show fanned out cards) */}
            {currentTurnDiscards && currentTurnDiscards.length > 0 && (
              <div className="pile-container">
                <span className="pile-title">Current Discard ({currentTurnDiscards.length})</span>
                <div className="fanned-cards-container">
                  {currentTurnDiscards.map((card, index) => (
                    <div 
                      key={card.id} 
                      className="fanned-card-wrapper" 
                      style={{ 
                        '--index': index,
                        '--total': currentTurnDiscards.length 
                      } as React.CSSProperties}
                    >
                      <Card card={card} disabled={true} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Player hand area at bottom */}
        <div className="player-hand-area">
          <div className="hand-header">
            <div className="hand-info">
              <h3>Your Hand</h3>
              <span>Total value: <strong>{myHandValue} pts</strong> (Threshold to Show is 10)</span>
            </div>
            
            <div className="hand-actions">
              {isMyTurn && turnPhase === 'DISCARD' && (
                <>
                  <button 
                    className="btn btn-primary"
                    disabled={!isSelectionValid}
                    onClick={handleDiscardClick}
                  >
                    Discard Selected ({selectedCardIds.length})
                  </button>
                  <button 
                    className="btn btn-danger"
                    disabled={myHandValue > 10}
                    onClick={handleShowClick}
                    title={myHandValue > 10 ? "Hand must be 10 or less to Declare Show!" : "Declare Show"}
                  >
                    Declare Show
                  </button>
                </>
              )}
              {isMyTurn && turnPhase === 'DRAW' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontSize: '0.9rem', fontWeight: 600 }}>
                  <AlertCircle size={16} />
                  Draw a card from the Closed Deck or Discard Pile!
                </div>
              )}
            </div>
          </div>

          <div className="cards-container">
            {orderedHand.map((card, index) => (
              <div
                key={card.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`draggable-card-wrapper ${draggedIndex === index ? 'dragging' : ''}`}
                style={{ cursor: draggedIndex === index ? 'grabbing' : 'grab' }}
              >
                <Card 
                  card={card} 
                  selected={selectedCardIds.includes(card.id)}
                  onClick={() => handleCardClick(card.id)}
                  disabled={!isMyTurn || turnPhase !== 'DISCARD'}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel (Right) */}
      <div className="side-panel">
        <div className="panel-section">
          <h3>Leaderboard</h3>
          <div className="mini-scoreboard">
            {[...players].sort((a,b) => a.score - b.score).map((p) => (
              <div 
                key={p.id} 
                className="mini-score-item"
                style={{ 
                  borderColor: p.id === myId ? 'var(--primary)' : 'var(--card-border)',
                  background: p.id === myId ? 'rgba(16, 185, 129, 0.05)' : 'none'
                }}
              >
                <span style={{ fontWeight: p.id === myId ? 600 : 400 }}>
                  {p.name} {p.id === myId && '(You)'}
                </span>
                <strong>{p.score} pts</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3>History Log</h3>
          <div className="history-log">
            {history.map((log, index) => (
              <div key={index} className="history-item">
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Gameplay Rules Button */}
        <button 
          className="rules-btn btn btn-secondary" 
          onClick={() => setIsRulesOpen(true)}
          style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', flexShrink: 0 }}
        >
          <BookOpen size={16} />
          Gameplay Rules
        </button>
      </div>

      {/* Rules Modal Overlay */}
      {isRulesOpen && (
        <div className="modal-overlay rules-modal-overlay" onClick={() => setIsRulesOpen(false)}>
          <div className="modal-content rules-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rules-modal-header">
              <h2>🃏 Least Count Rules</h2>
              <button className="rules-close-btn" onClick={() => setIsRulesOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="rules-modal-body">
              <section className="rules-section">
                <h3>🎯 Objective & Setup</h3>
                <p>The goal is to end the round with the <strong>lowest card points</strong> in your hand. Players accumulate points; crossing <strong>200 points</strong> eliminates you.</p>
                <p>Each player is dealt exactly <strong>7 cards</strong> to start.</p>
              </section>

              <section className="rules-section">
                <h3>🃏 Card Values</h3>
                <ul className="rules-list">
                  <li><strong>Joker:</strong> 0 points</li>
                  <li><strong>Ace:</strong> 1 point</li>
                  <li><strong>2 to 9:</strong> Face value</li>
                  <li><strong>10, J, Q, K:</strong> 10 points each</li>
                </ul>
              </section>

              <section className="rules-section">
                <h3>🔄 Turn Flow</h3>
                <ul className="rules-list">
                  <li><strong>1. Discard Phase:</strong> Discard at least one card. You can discard multiple cards of the <em>exact same rank</em> (e.g. two 8s).</li>
                  <li><strong>2. Draw Phase:</strong> Draw one card from the Closed Deck or Discard Pile.</li>
                </ul>
              </section>

              <section className="rules-section">
                <h3>⚡ Skip Draw Rule</h3>
                <p>If you discard cards matching the <strong>exact rank</strong> of the top card of the Discard Pile at the start of your turn, you skip the draw phase, reducing your hand size.</p>
              </section>

              <section className="rules-section">
                <h3>📢 Declaring "Show"</h3>
                <p>At the start of your turn, if your hand is <strong>10 points or less</strong>, you can declare Show.</p>
                <ul className="rules-list">
                  <li><strong>Successful Show</strong> (You have strictly the lowest hand): You get <code>0 points</code>; others get their hand value (capped at <code>25 points</code>).</li>
                  <li><strong>Wrong Show</strong> (Someone has lower or equal hand): You get a <code>+25 penalty</code>; actual lowest gets <code>0 points</code>; others get hand value (capped at <code>25 points</code>).</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
