import { Canvas, ThreeElements } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useState } from 'react'
import * as THREE from 'three'
import './App.css'
import Game from './components/Game'

declare module '@react-three/fiber' {
  interface ThreeElements {
    color: { attach: string; args: [THREE.ColorRepresentation] };
    ambientLight: { intensity?: number };
    directionalLight: { position?: [number, number, number]; intensity?: number };
  }
}

function App() {
  const [currentPlayer, setCurrentPlayer] = useState<'black' | 'white'>('black')
  const [winner, setWinner] = useState<'black' | 'white' | null>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [gameMode, setGameMode] = useState<'human' | 'ai'>('human')
  const [moveCount, setMoveCount] = useState(0)
  const [resetKey, setResetKey] = useState(0)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [aiError, setAIError] = useState<string | null>(null)

  const handleReset = () => {
    setWinner(null);
    setIsDraw(false);
    setCurrentPlayer('black');
    setMoveCount(0);
    setResetKey(prevKey => prevKey + 1);
    setIsAIThinking(false);
    setAIError(null);
  }

  const canSwitchMode = winner !== null || isDraw || moveCount === 0;

  const handleGameModeChange = (newMode: 'human' | 'ai') => {
    if (canSwitchMode) {
      setGameMode(newMode);
      handleReset();
    }
  };

  const handlePiecePlace = () => {
    setMoveCount(prev => prev + 1);
  };

  const handleDraw = () => {
    setIsDraw(true);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <div className="game-info">
        <h1>3D Gomoku</h1>
        <div className="mode-selector">
          <button
            className={gameMode === 'human' ? 'active' : ''}
            onClick={() => handleGameModeChange('human')}
            disabled={!canSwitchMode}
            title={!canSwitchMode ? "Finish current game to switch modes" : ""}
          >
            Player vs Player
          </button>
          <button
            className={gameMode === 'ai' ? 'active' : ''}
            onClick={() => handleGameModeChange('ai')}
            disabled={!canSwitchMode}
            title={!canSwitchMode ? "Finish current game to switch modes" : ""}
          >
            Player vs AI
          </button>
        </div>
        <div className="player-turn">
          {winner ? (
            <>
              <span className="winner-text">
                {winner === 'black' ? '⚫' : '⚪'} Wins!
              </span>
              <button className="reset-button" onClick={handleReset}>
                New Game
              </button>
            </>
          ) : isDraw ? (
            <>
              <span className="draw-text">Game ended in a draw!</span>
              <button className="reset-button" onClick={handleReset}>
                New Game
              </button>
            </>
          ) : (
            <>
              Current Player: {currentPlayer === 'black' ? '⚫' : '⚪'}
              {gameMode === 'ai' && currentPlayer === 'white' && ' (AI)'}
              <button className="reset-button" onClick={handleReset}>
                New Game
              </button>
            </>
          )}
        </div>
      </div>
      
      <Canvas 
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
        camera={{ position: [10, 8, 10], fov: 50 }}
      >
        <color attach="background" args={['#f0f0f0']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Game 
          currentPlayer={currentPlayer} 
          onPlayerChange={() => setCurrentPlayer(prev => prev === 'black' ? 'white' : 'black')}
          winner={winner}
          onWin={setWinner}
          onDraw={handleDraw}
          isDraw={isDraw}
          gameMode={gameMode}
          onPiecePlace={handlePiecePlace}
          resetKey={resetKey}
          isAIThinking={isAIThinking}
          setIsAIThinking={setIsAIThinking}
          onAIError={setAIError}
        />
        <OrbitControls 
          enableZoom={true} 
          enablePan={true} 
          minDistance={8} 
          maxDistance={25}
          makeDefault
        />
      </Canvas>

      {(isAIThinking || aiError) && (
        <div className="ai-status-overlay">
          <div>{aiError ? `AI error: ${aiError}` : 'AI is thinking...'}</div>
          {aiError && (
            <button
              className="retry-button"
              onClick={() => {
                setAIError(null);
                setIsAIThinking(false);
              }}
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default App
