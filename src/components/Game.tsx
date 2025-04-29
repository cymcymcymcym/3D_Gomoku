import { useState, useEffect } from 'react'
import { Vector3 } from 'three'
import Grid from './Grid'
import GamePiece from './GamePiece'
import HoverIndicator from './HoverIndicator'
import { Position } from '../types'

interface GameProps {
  currentPlayer: 'black' | 'white'
  onPlayerChange: () => void
  winner: 'black' | 'white' | null
  onWin: (winner: 'black' | 'white') => void
  onDraw: () => void
  isDraw: boolean
  gameMode?: 'human' | 'ai'
  onPiecePlace?: () => void
  resetKey?: number
  isAIThinking?: boolean
  setIsAIThinking?: (thinking: boolean) => void
  onAIError?: (error: string | null) => void
}

interface AIResponse {
  move: Position;
  source: 'alphazero';
  error?: string;
}

interface GamePiece {
  position: Position
  color: 'black' | 'white'
  id: number // Add unique ID to track pieces
  isAIMove: boolean // Track if this was placed by AI
  isWinningPiece?: boolean // Track if this piece is part of the winning line
}

const GRID_SIZE = 4
const CELL_SIZE = 1.5
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE * GRID_SIZE
const API_URL = `/api`

const Game: React.FC<GameProps> = ({ 
  currentPlayer, 
  onPlayerChange, 
  winner, 
  onWin,
  onDraw,
  isDraw,
  gameMode = 'human',
  onPiecePlace,
  resetKey = 0,
  isAIThinking = false,
  setIsAIThinking,
  onAIError
}) => {
  const [pieces, setPieces] = useState<GamePiece[]>([])
  const [hoverPosition, setHoverPosition] = useState<Position | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3
  const [lastRequestTime, setLastRequestTime] = useState<number | null>(null)
  const [networkStats, setNetworkStats] = useState<{
    requestCount: number;
    successCount: number;
    failureCount: number;
    avgResponseTime: number;
  }>({
    requestCount: 0,
    successCount: 0,
    failureCount: 0,
    avgResponseTime: 0
  });
  const [latestPieceId, setLatestPieceId] = useState<number | null>(null)
  const [winningPieceIds, setWinningPieceIds] = useState<number[]>([])

  // Debug logging for state changes
  useEffect(() => {
    console.log('Game state updated:', {
      currentPlayer,
      gameMode,
      isAIThinking,
      piecesCount: pieces.length,
      winner,
      isDraw,
      networkStats
    });
  }, [currentPlayer, gameMode, isAIThinking, pieces, winner, isDraw, networkStats]);

  // Reset board only when resetKey changes (new game) or game mode changes
  useEffect(() => {
    console.log('Board reset triggered:', { resetKey });
    setPieces([]);
    setLatestPieceId(null)
    setRetryCount(0);
    onAIError?.(null);
  }, [resetKey, gameMode, onAIError]);

  // Check for draw after each move
  useEffect(() => {
    if (!winner && !isDraw && pieces.length === TOTAL_CELLS) {
      console.log('Draw condition met');
      onDraw();
    }
  }, [pieces, winner, isDraw, onDraw]);

  const isValidPosition = (pos: Position): boolean => {
    return pos.x >= 0 && pos.x < GRID_SIZE &&
           pos.y >= 0 && pos.y < GRID_SIZE &&
           pos.z >= 0 && pos.z < GRID_SIZE;
  }

  const checkWin = (newPieces: GamePiece[]): { won: boolean, winningPieces: GamePiece[] } => {
    const lastPiece = newPieces[newPieces.length - 1]
    if (!lastPiece) return { won: false, winningPieces: [] }
    
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
      let connectedPieces = [lastPiece] // Start with the last placed piece
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
            connectedPieces.push(piece)
            pos = nextPos
          } else {
            break
          }
        }
      }

      if (count >= 4) {
        return { won: true, winningPieces: connectedPieces }
      }
    }
    return { won: false, winningPieces: [] }
  }

  const handlePlacePiece = (position: Position, color: 'black' | 'white' = currentPlayer, isAIMove = false): boolean => {
    console.log('Handling piece placement:', {
      position,
      color,
      currentPlayer,
      gameMode,
      isAIThinking,
      existingPieces: pieces.length
    });

    // Round the position values
    const roundedPosition = {
      x: Math.round(position.x),
      y: Math.round(position.y),
      z: Math.round(position.z)
    };

    // Validate position
    if (!isValidPosition(roundedPosition)) {
      console.log('Invalid position:', roundedPosition);
      return false;
    }

    // Check if position is already occupied
    if (pieces.some(p => 
      p.position.x === roundedPosition.x && 
      p.position.y === roundedPosition.y && 
      p.position.z === roundedPosition.z
    )) {
      console.log('Position already occupied:', roundedPosition);
      return false;
    }

    // Generate a unique ID for the new piece
    const newPieceId = Date.now()
    
    // Create new piece and update state
    const newPiece = { 
      position: roundedPosition, 
      color, 
      id: newPieceId,
      isAIMove
    }
    
    const newPieces = [...pieces, newPiece]
    console.log('Setting new pieces:', {
      newPiece,
      totalPieces: newPieces.length
    })
    
    setPieces(newPieces)
    setLatestPieceId(newPieceId)
    onPiecePlace?.()
    
    // Check win condition with improved function that returns winning pieces
    const { won, winningPieces } = checkWin(newPieces)
    
    if (won) {
      console.log('Win detected for player:', color, 'with winning pieces:', winningPieces);
      
      // Mark winning pieces
      const winningIds = winningPieces.map(p => p.id)
      setWinningPieceIds(winningIds)
      
      // Update pieces to mark winning pieces
      const updatedPieces = newPieces.map(piece => ({
        ...piece,
        isWinningPiece: winningIds.includes(piece.id)
      }))
      
      setPieces(updatedPieces)
      onWin(color)
      return true
    } 
    
    // Check draw condition
    if (newPieces.length === TOTAL_CELLS) {
      console.log('Draw detected');
      onDraw();
      return true;
    }

    return true;
  }

  // AI player logic
  useEffect(() => {
    let isMounted = true;

    const makeAIMove = async () => {
      if (gameMode === 'ai' && currentPlayer === 'white' && !winner && !isDraw && !isAIThinking) {
        console.log('AI move started:', {
          gameMode,
          currentPlayer,
          isAIThinking,
          piecesState: pieces,
          timestamp: new Date().toISOString()
        });

        setIsAIThinking?.(true);
        onAIError?.(null);
        setLastRequestTime(Date.now());

        try {
          console.log('Sending request to AI server...', {
            endpoint: `${API_URL}/ai-move`,
            pieceCount: pieces.length,
            timestamp: new Date().toISOString()
          });

          const startTime = Date.now();
          const response = await Promise.race([
            fetch(`${API_URL}/ai-move`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                pieces,
                requestId: Date.now(), // Add request ID for tracking
              }),
            }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 30000) // Increased timeout to 30s
            )
          ]);
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          console.log('AI server response received:', {
            status: response.status,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString()
          });

          setNetworkStats(prev => ({
            requestCount: prev.requestCount + 1,
            successCount: prev.successCount + (response.ok ? 1 : 0),
            failureCount: prev.failureCount + (response.ok ? 0 : 1),
            avgResponseTime: (prev.avgResponseTime * prev.requestCount + responseTime) / (prev.requestCount + 1)
          }));
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('AI server error response:', {
              status: response.status,
              error: errorData,
              timestamp: new Date().toISOString()
            });
            throw new Error(errorData.error || 'Failed to get AI move');
          }
          
          const data = await response.json() as AIResponse;
          console.log('AI move processed:', {
            move: data.move,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString()
          });
          
          if (data.move) {
            const newPosition = {
              x: Math.round(data.move.x),
              y: Math.round(data.move.y),
              z: Math.round(data.move.z)
            };

            // Validate the move
            if (!isValidPosition(newPosition) || pieces.some(p => 
              p.position.x === newPosition.x && 
              p.position.y === newPosition.y && 
              p.position.z === newPosition.z
            )) {
              throw new Error('Invalid move received from AI');
            }

            console.log('Applying AI move:', {
              position: newPosition,
              existingPieces: pieces.length,
              timestamp: new Date().toISOString()
            });

            // Apply the move
            const moveSuccess = handlePlacePiece(newPosition, 'white', true)
            
            if (moveSuccess && !winner && !isDraw) {
              onPlayerChange();
            }
            
            setIsAIThinking?.(false);
            setRetryCount(0);
          } else {
            throw new Error('Invalid AI move received');
          }
        } catch (error) {
          console.error('AI move error:', {
            error: error instanceof Error ? {
              message: error.message,
              stack: error.stack
            } : error,
            retryCount,
            maxRetries,
            lastRequestTime: lastRequestTime ? new Date(lastRequestTime).toISOString() : null,
            timeSinceLastRequest: lastRequestTime ? Date.now() - lastRequestTime : null,
            timestamp: new Date().toISOString()
          });

          // Handle connection errors with retry logic
          if (retryCount < maxRetries && 
              ((error instanceof TypeError) || 
               (error instanceof Error && error.message.includes('timeout')))) {
            setRetryCount(prev => prev + 1);
            onAIError?.(`Connection error. Retrying... (${retryCount + 1}/${maxRetries})`);
            // Retry after a delay
            setTimeout(() => {
              if (isMounted) {
                setIsAIThinking?.(false);
              }
            }, 1000);
          } else {
            onAIError?.(
              retryCount >= maxRetries
                ? "Could not connect to AI server. Please check your connection and try again."
                : error instanceof Error ? error.message : 'Unknown error'
            );
            setIsAIThinking?.(false);
          }
        }
      }
    };
    
    makeAIMove();

    return () => {
      isMounted = false;
    };
  }, [currentPlayer, gameMode, winner, isDraw, pieces, isAIThinking, retryCount, setIsAIThinking, onAIError, onWin, onDraw, onPlayerChange, onPiecePlace]);

  // Reset winning pieces when starting a new game
  useEffect(() => {
    setWinningPieceIds([])
  }, [resetKey])

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
        onCellClick={(pos) => {
          if (!winner && !isDraw && !isAIThinking && 
              !(gameMode === 'ai' && currentPlayer === 'white')) {
            if (handlePlacePiece(pos)) {
              onPlayerChange();
            }
          }
        }}
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
      
      {pieces.map((piece) => (
        <GamePiece
          key={piece.id}
          position={new Vector3(
            (piece.position.x - (GRID_SIZE - 1) / 2) * CELL_SIZE,
            (piece.position.y - (GRID_SIZE - 1) / 2) * CELL_SIZE,
            (piece.position.z - (GRID_SIZE - 1) / 2) * CELL_SIZE
          )}
          color={piece.color}
          isLatest={piece.id === latestPieceId}
          isAIMove={piece.isAIMove}
          isWinningPiece={piece.isWinningPiece || winningPieceIds.includes(piece.id)}
        />
      ))}
    </>
  )
}

export default Game