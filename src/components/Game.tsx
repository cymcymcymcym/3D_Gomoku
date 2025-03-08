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
  resetKey?: number
  isAIThinking?: boolean
  setIsAIThinking?: (thinking: boolean) => void
  onAIError?: (error: string | null) => void
}

interface AIResponse {
  move: Position;
  error?: string;
}

const GRID_SIZE = 4
const CELL_SIZE = 1.5
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE * GRID_SIZE
const API_URL = 'http://localhost:3001/api'

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
  const [pieces, setPieces] = useState<{ position: Position; color: 'black' | 'white' }[]>([])
  const [hoverPosition, setHoverPosition] = useState<Position | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  // Debug logging for state changes
  useEffect(() => {
    console.log('Game state updated:', {
      currentPlayer,
      gameMode,
      isAIThinking,
      piecesCount: pieces.length,
      winner,
      isDraw
    });
  }, [currentPlayer, gameMode, isAIThinking, pieces, winner, isDraw]);

  // Reset board only when resetKey changes (new game) or game mode changes
  useEffect(() => {
    console.log('Board reset triggered:', { resetKey });
    setPieces([]);
    setRetryCount(0);
    onAIError?.(null);
  }, [resetKey, gameMode, onAIError]); // Removed winner and isDraw from dependencies

  // Check for draw after each move
  useEffect(() => {
    if (!winner && !isDraw && pieces.length === TOTAL_CELLS) {
      console.log('Draw condition met');
      onDraw();
    }
  }, [pieces, winner, isDraw, onDraw]);

  // AI player logic with detailed logging
  useEffect(() => {
    let isMounted = true;

    const makeAIMove = async () => {
      if (gameMode === 'ai' && currentPlayer === 'white' && !winner && !isDraw && !isAIThinking) {
        console.log('AI move started:', {
          gameMode,
          currentPlayer,
          isAIThinking,
          piecesState: pieces
        });

        setIsAIThinking?.(true);
        onAIError?.(null);
        
        try {
          console.log('Sending request to AI server...');
          const response = await Promise.race([
            fetch(`${API_URL}/ai-move`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ pieces }),
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 5000)
            )
          ]) as Response;
          
          console.log('AI server response status:', response.status);
          
          if (!isMounted) return;
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('AI server error response:', errorData);
            throw new Error(errorData.error || 'Failed to get AI move');
          }
          
          const data = await response.json() as AIResponse;
          console.log('AI move received:', data);
          
          if (data.move) {
            if (!isMounted) return;

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

            // Apply the move
            const newPieces = [...pieces, { position: newPosition, color: 'white' }];
            setPieces(newPieces);
            onPiecePlace?.();

            if (checkWin(newPieces)) {
              onWin('white');
            } else if (newPieces.length === TOTAL_CELLS) {
              onDraw();
            } else {
              onPlayerChange();
            }

            setIsAIThinking?.(false);
            setRetryCount(0);
          } else {
            throw new Error('Invalid AI move received');
          }
        } catch (error) {
          if (!isMounted) return;

          console.error('AI move error details:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
            currentGameState: {
              pieces,
              currentPlayer,
              gameMode,
              isAIThinking
            }
          });
          
          // Handle connection errors with retry logic
          if (retryCount < maxRetries && 
              ((error instanceof TypeError) || 
               (error instanceof Error && error.message === 'Request timeout'))) {
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

  const handlePlacePiece = (position: Position, color: 'black' | 'white' = currentPlayer) => {
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

    // Create new piece and update state
    const newPieces = [...pieces, { position: roundedPosition, color }];
    console.log('Setting new pieces:', {
      newPiece: { position: roundedPosition, color },
      totalPieces: newPieces.length
    });
    
    setPieces(newPieces);
    onPiecePlace?.();
    
    // Check win condition
    if (checkWin(newPieces)) {
      console.log('Win detected for player:', color);
      onWin(color);
      return true;
    } 
    
    // Check draw condition
    if (newPieces.length === TOTAL_CELLS) {
      console.log('Draw detected');
      onDraw();
      return true;
    }

    return true;
  }

  // Effect to handle AI moves
  useEffect(() => {
    let isEffectActive = true;

    const makeAIMove = async () => {
      // Only proceed if it's AI's turn and the game is still ongoing
      if (gameMode !== 'ai' || currentPlayer !== 'white' || winner || isDraw || isAIThinking) {
        console.log('Skipping AI move:', {
          gameMode,
          currentPlayer,
          winner,
          isDraw,
          isAIThinking
        });
        return;
      }

      console.log('Starting AI move process:', {
        currentPieces: pieces.length,
        isAIThinking
      });

      try {
        setIsAIThinking?.(true);
        onAIError?.(null);

        // Make the API request
        const response = await fetch(`${API_URL}/ai-move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pieces })
        });

        if (!isEffectActive) {
          console.log('Effect no longer active, aborting AI move');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to get AI move');
        }

        const data = await response.json() as AIResponse;
        console.log('Received AI move:', data);

        if (!data.move || !isValidPosition(data.move)) {
          throw new Error('Invalid move received from AI');
        }

        // Place the AI's piece
        const moveSuccess = handlePlacePiece(data.move, 'white');
        console.log('AI move placement result:', {
          success: moveSuccess,
          position: data.move
        });

        if (moveSuccess && !winner && !isDraw) {
          onPlayerChange();
        }

      } catch (error) {
        console.error('AI move error:', error);
        onAIError?.(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        if (isEffectActive) {
          console.log('Clearing AI thinking state');
          setIsAIThinking?.(false);
        }
      }
    };

    // Start the AI move process
    makeAIMove();

    // Cleanup function
    return () => {
      isEffectActive = false;
    };
  }, [currentPlayer, gameMode, winner, isDraw, pieces]); // Remove isAIThinking from dependencies

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