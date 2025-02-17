import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useState } from 'react'
import './App.css'
import Game from './components/Game'

function App() {
  const [currentPlayer, setCurrentPlayer] = useState<'black' | 'white'>('black')
  const [winner, setWinner] = useState<'black' | 'white' | null>(null)

  const handleReset = () => {
    setWinner(null);
    setCurrentPlayer('black');
  }

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
