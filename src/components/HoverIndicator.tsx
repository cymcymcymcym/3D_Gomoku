import React from 'react'
import { Vector3 } from 'three'

interface HoverIndicatorProps {
  position: Vector3 | null
  color: 'black' | 'white'
}

const HoverIndicator: React.FC<HoverIndicatorProps> = ({ position, color }) => {
  if (!position) return null;
  
  return (
    // @ts-ignore
    <mesh position={position}>
      {/* @ts-ignore */}
      <sphereGeometry args={[0.4]} />
      {/* @ts-ignore */}
      <meshStandardMaterial
        color={color === 'black' ? '#000000' : '#ffffff'}
        transparent
        opacity={0.3}
        depthWrite={false}
      />
    </mesh>
  );
};

export default HoverIndicator;