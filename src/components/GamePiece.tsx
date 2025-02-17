import { Vector3 } from 'three'

interface GamePieceProps {
  position: Vector3
  color: 'black' | 'white'
}

const GamePiece: React.FC<GamePieceProps> = ({ position, color }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial
        color={color}
        roughness={0.2}
        metalness={0.3}
        emissive={color}
        emissiveIntensity={0.1}
      />
    </mesh>
  )
}

export default GamePiece