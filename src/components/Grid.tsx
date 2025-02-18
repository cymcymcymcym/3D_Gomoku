import { Vector3 } from 'three'
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

  return (
    <group>
      {/* Semi-transparent grid planes */}
      <group position={[0, 0, -offset * cellSize]}>
        <mesh>
          <planeGeometry args={[totalSize, totalSize]} />
          <meshBasicMaterial color="#e0e0e0" transparent opacity={0.2} side={2} />
        </mesh>
      </group>
      <group position={[-offset * cellSize, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[totalSize, totalSize]} />
          <meshBasicMaterial color="#e0e0e0" transparent opacity={0.2} side={2} />
        </mesh>
      </group>
      <group position={[0, -offset * cellSize, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <planeGeometry args={[totalSize, totalSize]} />
          <meshBasicMaterial color="#e0e0e0" transparent opacity={0.2} side={2} />
        </mesh>
      </group>

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
                onPointerMove={(e) => {
                  e.stopPropagation();
                  const pos = worldToGridPosition(worldX, worldY, worldZ);
                  if (isValidPosition(pos)) {
                    onCellHover(pos);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const pos = worldToGridPosition(worldX, worldY, worldZ);
                  if (isValidPosition(pos)) {
                    onCellClick(pos);
                  }
                }}
              >
                <sphereGeometry args={[cellSize * 0.06]} />
                <meshBasicMaterial color="#333333" />
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
              <lineBasicMaterial attach="material" color="#666666" />
            </line>
            {/* Y lines */}
            <line>
              <bufferGeometry attach="geometry" {...{
                setFromPoints: [
                  new Vector3(-offset * cellSize, pos, -offset * cellSize),
                  new Vector3((size - 1 - offset) * cellSize, pos, -offset * cellSize)
                ]
              }} />
              <lineBasicMaterial attach="material" color="#666666" />
            </line>
            {/* Z lines */}
            <line>
              <bufferGeometry attach="geometry" {...{
                setFromPoints: [
                  new Vector3(-offset * cellSize, -offset * cellSize, pos),
                  new Vector3(-offset * cellSize, (size - 1 - offset) * cellSize, pos)
                ]
              }} />
              <lineBasicMaterial attach="material" color="#666666" />
            </line>
          </group>
        );
      })}
    </group>
  );
};

export default Grid;