import { useState, useEffect } from 'react'
import { Vector3 } from 'three'
import Grid from './Grid'
import GamePiece from './GamePiece'
import HoverIndicator from './HoverIndicator'

interface Position {
  x: number
  y: number
  z: number
}

interface GameProps {
  currentPlayer: 'black' | 'white'
  onPlayerChange: () => void
  winner: 'black' | 'white' | null
  onWin: (winner: 'black' | 'white') => void
  onDraw: () => void
  isDraw: boolean
  gameMode?: 'human' | 'ai'
  onPiecePlace?: () => void
  resetKey?: number // Added resetKey prop to trigger board reset
}

const GRID_SIZE = 4
const CELL_SIZE = 1.5
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE * GRID_SIZE

const Game: React.FC<GameProps> = ({ 
  currentPlayer, 
  onPlayerChange, 
  winner, 
  onWin,
  onDraw,
  isDraw,
  gameMode = 'human',
  onPiecePlace,
  resetKey = 0
}) => {
  const [pieces, setPieces] = useState<{ position: Position; color: 'black' | 'white' }[]>([])
  const [hoverPosition, setHoverPosition] = useState<Position | null>(null)
  const [isAIThinking, setIsAIThinking] = useState(false)

  // Reset board when winner changes, game mode changes, or resetKey changes
  useEffect(() => {
    setPieces([]);
  }, [winner, isDraw, resetKey]); // Added resetKey to dependency array

  // Check for draw after each move
  useEffect(() => {
    if (!winner && !isDraw && pieces.length === TOTAL_CELLS) {
      onDraw();
    }
  }, [pieces, winner, isDraw, onDraw]);

  // AI player logic (placeholder for now)
  useEffect(() => {
    const makeAIMove = async () => {
      if (gameMode === 'ai' && currentPlayer === 'white' && !winner && !isDraw && !isAIThinking) {
        setIsAIThinking(true);
        
        // Simulate AI thinking time
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // For now, just make a random valid move
        const validPositions: Position[] = [];
        
        // Find all empty positions
        for (let x = 0; x < GRID_SIZE; x++) {
          for (let y = 0; y < GRID_SIZE; y++) {
            for (let z = 0; z < GRID_SIZE; z++) {
              const pos = { x, y, z };
              if (!pieces.some(p => 
                p.position.x === pos.x && 
                p.position.y === pos.y && 
                p.position.z === pos.z
              )) {
                validPositions.push(pos);
              }
            }
          }
        }
        
        if (validPositions.length > 0) {
          // Pick a random valid position
          const randomPos = validPositions[Math.floor(Math.random() * validPositions.length)];
          handlePlacePiece(randomPos);
        }
        
        setIsAIThinking(false);
      }
    };
    
    makeAIMove();
  }, [currentPlayer, gameMode, winner, isDraw, pieces, isAIThinking]);

  const isValidPosition = (pos: Position): boolean => {
    return pos.x >= 0 && pos.x < GRID_SIZE &&
           pos.y >= 0 && pos.y < GRID_SIZE &&
           pos.z >= 0 && pos.z < GRID_SIZE;
  }

  const checkWin = (newPieces: typeof pieces): boolean => {
    const lastPiece = newPieces[newPieces.length - 1]
    if (!lastPiece) return false

    // All possible directions to check (26 directions in 3D space)
    const directions = [
      [1, 0, 0], [-1, 0, 0],  // x axis
      [0, 1, 0], [0, -1, 0],  // y axis
      [0, 0, 1], [0, 0, -1],  // z axis
      [1, 1, 0], [-1, -1, 0], [1, -1, 0], [-1, 1, 0],  // xy diagonals
      [1, 0, 1], [-1, 0, -1], [1, 0, -1], [-1, 0, 1],  // xz diagonals
      [0, 1, 1], [0, -1, -1], [0, 1, -1], [0, -1, 1],  // yz diagonals
      [1, 1, 1], [-1, -1, -1],  // xyz diagonals
      [1, 1, -1], [-1, -1, 1],
      [1, -1, 1], [-1, 1, -1],
      [-1, 1, 1], [1, -1, -1]
    ]

    for (const [dx, dy, dz] of directions) {
      let count = 1
      let pos = { ...lastPiece.position }

      // Check in both directions
      for (let dir = 0; dir < 2; dir++) {
        const multiplier = dir === 0 ? 1 : -1
        pos = { ...lastPiece.position }
        
        for (let step = 1; step < 5; step++) {
          const nextPos = {
            x: pos.x + dx * multiplier,
            y: pos.y + dy * multiplier,
            z: pos.z + dz * multiplier
          }

          const piece = newPieces.find(p => 
            p.position.x === nextPos.x && 
            p.position.y === nextPos.y && 
            p.position.z === nextPos.z && 
            p.color === lastPiece.color
          )

          if (piece) {
            count++
            pos = nextPos
          } else {
            break
          }
        }
      }

      if (count >= 4) {
        return true
      }
    }
    return false
  }

  const handlePlacePiece = (position: Position) => {
    // Prevent placing pieces when the game is over or when it's AI's turn
    if (winner || isDraw || (gameMode === 'ai' && currentPlayer === 'white') || isAIThinking) return;
    
    if (!isValidPosition(position)) {
      return;
    }

    if (pieces.some(p => 
      p.position.x === position.x && 
      p.position.y === position.y && 
      p.position.z === position.z
    )) {
      return;
    }

    const newPieces = [...pieces, { 
      position: {
        x: Math.round(position.x),
        y: Math.round(position.y),
        z: Math.round(position.z)
      }, 
      color: currentPlayer 
    }];
    
    setPieces(newPieces);
    onPiecePlace?.();
    
    if (checkWin(newPieces)) {
      onWin(currentPlayer);
    } else {
      // Check for draw
      if (newPieces.length === TOTAL_CELLS) {
        onDraw();
      } else {
        onPlayerChange();
      }
    }
  }

  return (
    <>
      <Grid 
        size={GRID_SIZE} 
        cellSize={CELL_SIZE} 
        onCellHover={(pos) => { 
          if (isValidPosition(pos)) {
            setHoverPosition(pos)
          }
        }}
        onCellClick={handlePlacePiece}
      />
      
      {/* Show hover indicator when it's player's turn and game is not over */}
      {hoverPosition && !winner && !isDraw && !isAIThinking && 
       !(gameMode === 'ai' && currentPlayer === 'white') &&
       !pieces.some(p => 
        p.position.x === hoverPosition.x && 
        p.position.y === hoverPosition.y && 
        p.position.z === hoverPosition.z
      ) && (
        <HoverIndicator
          position={new Vector3(
            (hoverPosition.x - (GRID_SIZE - 1) / 2) * CELL_SIZE,
            (hoverPosition.y - (GRID_SIZE - 1) / 2) * CELL_SIZE,
            (hoverPosition.z - (GRID_SIZE - 1) / 2) * CELL_SIZE
          )}
          color={currentPlayer}
        />
      )}
      
      {pieces.map((piece, index) => (
        <GamePiece
          key={index}
          position={new Vector3(
            (piece.position.x - (GRID_SIZE - 1) / 2) * CELL_SIZE,
            (piece.position.y - (GRID_SIZE - 1) / 2) * CELL_SIZE,
            (piece.position.z - (GRID_SIZE - 1) / 2) * CELL_SIZE
          )}
          color={piece.color}
        />
      ))}
      
      {isAIThinking && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          zIndex: 1000
        }}>
          AI is thinking...
        </div>
      )}
    </>
  )
}

export default Game