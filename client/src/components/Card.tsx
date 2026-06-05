import React from 'react';
import type { Card as CardType } from '../../../server/src/types';

interface CardProps {
  card: CardType;
  selected?: boolean;
  onClick?: () => void;
  faceUp?: boolean;
  disabled?: boolean;
}

const GRID_POSITIONS: Record<string, { col: number; row: number }[]> = {
  'A': [{ col: 2, row: 3 }],
  '2': [
    { col: 2, row: 1 },
    { col: 2, row: 5 }
  ],
  '3': [
    { col: 2, row: 1 },
    { col: 2, row: 3 },
    { col: 2, row: 5 }
  ],
  '4': [
    { col: 1, row: 1 }, { col: 3, row: 1 },
    { col: 1, row: 5 }, { col: 3, row: 5 }
  ],
  '5': [
    { col: 1, row: 1 }, { col: 3, row: 1 },
    { col: 2, row: 3 },
    { col: 1, row: 5 }, { col: 3, row: 5 }
  ],
  '6': [
    { col: 1, row: 1 }, { col: 3, row: 1 },
    { col: 1, row: 3 }, { col: 3, row: 3 },
    { col: 1, row: 5 }, { col: 3, row: 5 }
  ],
  '7': [
    { col: 1, row: 1 }, { col: 3, row: 1 },
    { col: 2, row: 2 },
    { col: 1, row: 3 }, { col: 3, row: 3 },
    { col: 1, row: 5 }, { col: 3, row: 5 }
  ],
  '8': [
    { col: 1, row: 1 }, { col: 3, row: 1 },
    { col: 2, row: 2 },
    { col: 1, row: 3 }, { col: 3, row: 3 },
    { col: 2, row: 4 },
    { col: 1, row: 5 }, { col: 3, row: 5 }
  ],
  '9': [
    { col: 1, row: 1 }, { col: 3, row: 1 },
    { col: 1, row: 2 }, { col: 3, row: 2 },
    { col: 2, row: 3 },
    { col: 1, row: 4 }, { col: 3, row: 4 },
    { col: 1, row: 5 }, { col: 3, row: 5 }
  ],
  '10': [
    { col: 1, row: 1 }, { col: 3, row: 1 },
    { col: 1, row: 2 }, { col: 3, row: 2 },
    { col: 2, row: 2 },
    { col: 2, row: 4 },
    { col: 1, row: 4 }, { col: 3, row: 4 },
    { col: 1, row: 5 }, { col: 3, row: 5 }
  ]
};

export const Card: React.FC<CardProps> = ({
  card,
  selected = false,
  onClick,
  faceUp = true,
  disabled = false
}) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const isJoker = card.suit === 'joker';

  const getSuitSymbol = (suit: CardType['suit']) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      case 'joker': return '🃏';
      default: return '';
    }
  };

  const suitSymbol = getSuitSymbol(card.suit);

  // Render Face Card Art SVGs
  const renderFaceCardArt = (rank: string) => {
    switch (rank) {
      case 'K': // King Crown
        return (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4l3 12h14l3-12-5 4-4-6-4 6-5-4z" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round"/>
            <rect x="5" y="16" width="14" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
          </svg>
        );
      case 'Q': // Queen Tiara
        return (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 7l2 9h12l2-9-4 3.5-4-5-4 5-4-3.5z" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round"/>
            <path d="M2 18h20v2H2z" fill="currentColor" fillOpacity="0.4"/>
            <circle cx="12" cy="11.5" r="1.5" fill="currentColor"/>
          </svg>
        );
      case 'J': // Jack Knight Shield
        return (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 21s7-3.5 7-9V5.5L12 3 5 5.5v6.5c0 5.5 7 9 7 9z" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round"/>
            <path d="M12 6.5v10M9.5 9.5h5" strokeLinecap="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  if (!faceUp) {
    return (
      <div 
        className="card-wrapper" 
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        onClick={!disabled ? onClick : undefined}
      >
        <div className="card-inner" style={{ transform: 'rotateY(180deg)' }}>
          <div className="card-face card-back">
            <div className="card-back-pattern" />
          </div>
        </div>
      </div>
    );
  }

  const isFaceCard = ['J', 'Q', 'K'].includes(card.rank);
  const positions = GRID_POSITIONS[card.rank] || [];

  return (
    <div
      className={`card-wrapper ${selected ? 'selected' : ''}`}
      onClick={!disabled ? onClick : undefined}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className="card-inner">
        <div 
          className={`card-face card-front ${
            isJoker ? 'joker-front' : isRed ? 'red-suit' : 'black-suit'
          }`}
        >
          <div className="card-front-top">
            <span>{card.rank}</span>
            {!isJoker && <span>{suitSymbol}</span>}
          </div>
          
          <div className="card-front-center">
            {isJoker ? (
              <span className="joker-text">Joker</span>
            ) : isFaceCard ? (
              <div className="face-card-art">
                {renderFaceCardArt(card.rank)}
              </div>
            ) : (
              <div className="card-grid-layout">
                {positions.map((pos, idx) => (
                  <div 
                    key={idx} 
                    className="card-grid-symbol"
                    style={{ 
                      gridColumn: pos.col, 
                      gridRow: pos.row,
                      fontSize: card.rank === 'A' ? '2.2rem' : '0.8rem'
                    }}
                  >
                    {suitSymbol}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="card-front-bottom">
            <span>{card.rank}</span>
            {!isJoker && <span>{suitSymbol}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
