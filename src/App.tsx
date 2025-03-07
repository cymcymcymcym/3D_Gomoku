import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useState } from 'react'
import './App.css'
import Game from './components/Game'

function App() {
  const [currentPlayer, setCurrentPlayer] = useState<'black' | 'white'>('black')
  const [winner, setWinner] = useState<'black' | 'white' | null>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [gameMode, setGameMode] = useState<'human' | 'ai'>('human')
  const [moveCount, setMoveCount] = useState(0)
  const [resetKey, setResetKey] = useState(0) // Add resetKey state to trigger board reset

  const handleReset = () => {
    setWinner(null);
    setIsDraw(false);
    setCurrentPlayer('black');
    setMoveCount(0);
    setResetKey(prevKey => prevKey + 1); // Increment resetKey to force Game component to reset
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
            title={!canSwitchMode ? "Finish current game or start new game to switch modes" : ""}
          >
            Player vs Player
          </button>
          <button
            className={gameMode === 'ai' ? 'active' : ''}
            onClick={() => handleGameModeChange('ai')}
            disabled={!canSwitchMode}
            title={!canSwitchMode ? "Finish current game or start new game to switch modes" : ""}
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
              {moveCount > 0 && (
                <button className="reset-button" onClick={handleReset}>
                  New Game
                </button>
              )}
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
          resetKey={resetKey} // Pass resetKey to Game component
        />
        <OrbitControls 
          enableZoom={true} 
          enablePan={true} 
          minDistance={8} 
          maxDistance={25}
          makeDefault
        />
      </Canvas>
    </div>
  )
}

export default App
