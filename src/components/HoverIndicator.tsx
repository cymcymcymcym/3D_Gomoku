import { Vector3 } from 'three'

interface HoverIndicatorProps {
  position: Vector3 | null
  color: 'black' | 'white'
}

const HoverIndicator: React.FC<HoverIndicatorProps> = ({ position, color }) => {
  if (!position) return null;
  
  return (
    <group position={position}>
      {/* Semi-transparent preview piece */}
      <mesh>
        <sphereGeometry args={[0.4]} />
        <meshStandardMaterial
          color={color === 'black' ? '#000000' : '#ffffff'}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
      
      {/* Preview shadow */}
      <mesh 
        position={[0, -position.y + 0.01, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={1}
      >
        <circleGeometry args={[0.35]} />
        <meshBasicMaterial
          color={color === 'black' ? '#000000' : '#ffffff'}
          transparent
          opacity={0.2}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </group>
  );
};

export default HoverIndicator;