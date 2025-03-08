import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useState } from 'react'
import './App.css'
import Game from './Game'

function App() {
  const [currentPlayer, setCurrentPlayer] = useState<'black' | 'white'>('black')
  const [winner, setWinner] = useState<'black' | 'white' | null>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [showGuides, setShowGuides] = useState(false)

  const handleReset = () => {
    setWinner(null);
    setIsDraw(false);
    setCurrentPlayer('black');
  };

  const handleDraw = () => {
    setIsDraw(true);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <div className="game-info">
        <h1>3D Gomoku</h1>
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
          ) : (
            <>Current Player: {currentPlayer === 'black' ? '⚫' : '⚪'}</>
          )}
        </div>
      </div>
      <div className="view-controls">
        <button
          onClick={() => setShowGuides(!showGuides)}
          className={showGuides ? 'active' : ''}
        >
          {showGuides ? 'Hide Coordinates' : 'Show Coordinates'}
        </button>
      </div>
      <Canvas
        camera={{
          position: [18, 15, 18],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true,
          alpha: false,
          logarithmicDepthBuffer: true
        }}
        shadows
      >
        <color attach="background" args={['#ffffff']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={0.6} />
        <directionalLight position={[-5, -5, -5]} intensity={0.4} />
        <Game
          currentPlayer={currentPlayer}
          onPlayerChange={() => setCurrentPlayer(prev => prev === 'black' ? 'white' : 'black')}
          winner={winner}
          onWin={setWinner}
          showGuides={showGuides}
          onDraw={handleDraw}
          isDraw={isDraw}
        />
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          minDistance={12}
          maxDistance={40}
          makeDefault
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  )
}

export default App