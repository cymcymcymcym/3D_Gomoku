import React, { useRef, useState, useEffect } from 'react'
import { Vector3 } from 'three'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

interface GamePieceProps {
  position: Vector3
  color: 'black' | 'white'
  isLatest?: boolean
  isAIMove?: boolean
  isWinningPiece?: boolean
}

const GamePiece: React.FC<GamePieceProps> = ({ 
  position, 
  color, 
  isLatest = false, 
  isAIMove = false,
  isWinningPiece = false
}) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [showLabel, setShowLabel] = useState(true)
  const [winningEffectTime, setWinningEffectTime] = useState(0)
  
  // Animation effect for new pieces
  useEffect(() => {
    if (isLatest) {
      setAnimationProgress(0)
      
      // Show the label for 5 seconds
      const timer = setTimeout(() => {
        setShowLabel(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [isLatest])
  
  // Animate the pieces
  useFrame((_, delta) => {
    // Latest piece animation
    if (isLatest && meshRef.current && animationProgress < 1) {
      // Update animation progress
      setAnimationProgress(prev => Math.min(prev + delta * 0.5, 1))
      
      // Pulse scale effect
      const scale = 1 + Math.sin(animationProgress * Math.PI * 2) * 0.1 * (1 - animationProgress)
      meshRef.current.scale.set(scale, scale, scale)
      
      // Gentle rotation for latest piece
      meshRef.current.rotation.y += delta
    }
    
    // Winning pieces effect
    if (isWinningPiece) {
      // Update the winning effect time
      setWinningEffectTime(prev => prev + delta)
      
      if (meshRef.current) {
        // Gentle perpetual rotation for winning pieces
        meshRef.current.rotation.y += delta * 0.8
        
        // Small pulsing scale effect for winning pieces
        const pulseScale = 1 + Math.sin(winningEffectTime * 3) * 0.05
        meshRef.current.scale.set(pulseScale, pulseScale, pulseScale)
      }
      
      // Animated glow effect for winning pieces
      if (glowRef.current) {
        // Make the glow grow and shrink
        const glowScale = 1.2 + Math.sin(winningEffectTime * 2) * 0.15
        glowRef.current.scale.set(glowScale, glowScale, glowScale)
        // Rotate the glow in the opposite direction
        glowRef.current.rotation.y -= delta * 0.5
      }
    }
  })
  
  // Use solid colors for pieces
  const pieceColor = color === 'black' ? '#000000' : '#ffffff'
  
  // Always gold color for winning pieces
  const glowColor = isWinningPiece
    ? '#ffd700' // Gold for all winning pieces
    : color === 'black' ? '#303030' : '#ffffff'
  
  // Increased glow opacity for winning pieces
  const glowOpacity = isWinningPiece ? 0.3 : 0.15
  
  return (
    <group position={position}>
      {/* Main piece */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          color={pieceColor}
          roughness={0.1}
          metalness={isWinningPiece ? 0.8 : 0.3} // More metallic look for winning pieces
          emissive={isWinningPiece ? glowColor : pieceColor}
          emissiveIntensity={isWinningPiece ? 0.3 : 0.1}
        />
      </mesh>
      
      {/* Outer glow effect (for latest move or winning piece) */}
      {(isLatest || isWinningPiece) && (
        <mesh 
          ref={glowRef}
          scale={[1.15, 1.15, 1.15]}
        >
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial
            color={glowColor}
            transparent={true}
            opacity={glowOpacity}
            depthWrite={false}
          />
        </mesh>
      )}
      
      {/* Extra outer glow for winning pieces */}
      {isWinningPiece && (
        <mesh scale={[1.4, 1.4, 1.4]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial
            color={glowColor}
            transparent={true}
            opacity={0.15}
            depthWrite={false}
          />
        </mesh>
      )}
      
      {/* Trail effect for winning pieces */}
      {isWinningPiece && (
        <group>
          {[1, 2, 3].map((i) => (
            <mesh
              key={i}
              position={[
                Math.sin(winningEffectTime * 3 + i) * 0.05,
                Math.cos(winningEffectTime * 2 + i) * 0.05,
                Math.sin(winningEffectTime * 4 + i) * 0.05
              ]}
              scale={[0.8 - i * 0.15, 0.8 - i * 0.15, 0.8 - i * 0.15]}
            >
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshBasicMaterial
                color={glowColor}
                transparent={true}
                opacity={(0.2 - i * 0.05) * (0.5 + Math.sin(winningEffectTime * 5 + i) * 0.5)}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      )}
      
      {/* "AI Move" label */}
      {isLatest && isAIMove && showLabel && !isWinningPiece && (
        <Html position={[0, 0.7, 0]} center>
          <div style={{
            background: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            padding: '4px 6px',
            borderRadius: '3px',
            fontSize: '11px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            transform: 'scale(1.2)',
            boxShadow: '0 0 3px rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.2)',
            opacity: Math.min(0.8, 1.2 - animationProgress * 0.5),
          }}>
            AI Move
          </div>
        </Html>
      )}
      
      {/* "Winning Move" label for the latest piece in a winning line */}
      {isLatest && isWinningPiece && (
        <Html position={[0, 0.8, 0]} center>
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#ffd700',
            padding: '5px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            transform: 'scale(1.4)',
            boxShadow: '0 0 6px rgba(255,215,0,0.5)',
            border: '1px solid rgba(255,215,0,0.5)',
          }}>
            Winning Move!
          </div>
        </Html>
      )}
    </group>
  )
}

export default GamePiece