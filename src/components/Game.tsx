import { useRef, useState, useEffect } from 'react'
import { Vector3 } from 'three'
import Grid from './Grid'
import GamePiece from './GamePiece'

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
}

const GRID_SIZE = 7
const CELL_SIZE = 1.5

const Game: React.FC<GameProps> = ({ currentPlayer, onPlayerChange, winner, onWin }) => {
  const [pieces, setPieces] = useState<{ position: Position; color: 'black' | 'white' }[]>([])
  const hoverPosition = useRef<Position | null>(null)

  useEffect(() => {
    if (winner === null) {
      setPieces([]);
    }
  }, [winner]);

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

      if (count >= 5) {
        return true
      }
    }
    return false
  }

  const handlePlacePiece = (position: Position) => {
    if (winner) return;
    
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

    if (checkWin(newPieces)) {
      onWin(currentPlayer);
    } else {
      onPlayerChange();
    }
  }

  return (
    <>
      <Grid 
        size={GRID_SIZE} 
        cellSize={CELL_SIZE} 
        onCellHover={(pos) => { 
          if (isValidPosition(pos)) {
            hoverPosition.current = pos;
          }
        }}
        onCellClick={handlePlacePiece}
      />
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
    </>
  )
}

export default Game