import { Vector3 } from 'three'
import { ThreeEvent } from '@react-three/fiber'
import { Position } from './Game'

interface GridProps {
  size: number
  cellSize: number
  onCellHover: (position: Position) => void
  onCellClick: (position: Position) => void
}

const Grid: React.FC<GridProps> = ({ size, cellSize, onCellHover, onCellClick }) => {
  const offset = (size - 1) / 2; // Changed to center grid at origin
  const totalSize = size * cellSize;

  // Helper to convert world position to grid position
  const worldToGridPosition = (x: number, y: number, z: number): Position => {
    return {
      x: Math.round(x / cellSize + offset),
      y: Math.round(y / cellSize + offset),
      z: Math.round(z / cellSize + offset)
    };
  };

  // Helper to check if position is within bounds
  const isValidPosition = (pos: Position): boolean => {
    return pos.x >= 0 && pos.x < size &&
           pos.y >= 0 && pos.y < size &&
           pos.z >= 0 && pos.z < size;
  };

  // Helper to determine point color based on position
  const getPointColor = (x: number, y: number, z: number): string => {
    // Sum of coordinates determines color - if sum is even, one color, if odd, another color
    return ((x + y + z) % 2 === 0) ? "#2a4d69" : "#4b86b4";
  };

  return (
    <group>
      {/* Grid intersection points */}
      {Array.from({ length: size }).map((_, x) =>
        Array.from({ length: size }).map((_, y) =>
          Array.from({ length: size }).map((_, z) => {
            const worldX = (x - offset) * cellSize;
            const worldY = (y - offset) * cellSize;
            const worldZ = (z - offset) * cellSize;
            
            return (
              <mesh
                key={`${x}-${y}-${z}`}
                position={[worldX, worldY, worldZ]}
                onPointerMove={(e: ThreeEvent<PointerEvent>) => {
                  e.stopPropagation();
                  const pos = worldToGridPosition(worldX, worldY, worldZ);
                  if (isValidPosition(pos)) {
                    onCellHover(pos);
                  }
                }}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                  e.stopPropagation();
                  const pos = worldToGridPosition(worldX, worldY, worldZ);
                  if (isValidPosition(pos)) {
                    onCellClick(pos);
                  }
                }}
              >
                <sphereGeometry args={[cellSize * 0.06]} />
                <meshBasicMaterial color={getPointColor(x, y, z)} />
              </mesh>
            )
          })
        )
      )}

      {/* Grid lines */}
      {Array.from({ length: size }).map((_, i) => {
        const pos = (i - offset) * cellSize;
        return (
          <group key={i}>
            {/* X lines */}
            <line>
              <bufferGeometry attach="geometry" {...{
                setFromPoints: [
                  new Vector3(pos, -offset * cellSize, -offset * cellSize),
                  new Vector3(pos, (size - 1 - offset) * cellSize, -offset * cellSize)
                ]
              }} />
              <lineBasicMaterial attach="material" color="#555555" />
            </line>
            {/* Y lines */}
            <line>
              <bufferGeometry attach="geometry" {...{
                setFromPoints: [
                  new Vector3(-offset * cellSize, pos, -offset * cellSize),
                  new Vector3((size - 1 - offset) * cellSize, pos, -offset * cellSize)
                ]
              }} />
              <lineBasicMaterial attach="material" color="#555555" />
            </line>
            {/* Z lines */}
            <line>
              <bufferGeometry attach="geometry" {...{
                setFromPoints: [
                  new Vector3(-offset * cellSize, -offset * cellSize, pos),
                  new Vector3(-offset * cellSize, (size - 1 - offset) * cellSize, pos)
                ]
              }} />
              <lineBasicMaterial attach="material" color="#555555" />
            </line>
          </group>
        );
      })}
    </group>
  );
};

export default Grid;