import { Object3DNode, MaterialNode, extend } from '@react-three/fiber'
import { Mesh, Line, Group, Color, AmbientLight, DirectionalLight, Material, BufferGeometry, Object3D } from 'three'
import { ColorRepresentation } from 'three'

declare module 'three' {
  interface Object3DEventMap {
    click: MouseEvent;
    pointerdown: PointerEvent;
    pointerup: PointerEvent;
    pointermove: PointerEvent;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      primitive: { object: any; attach?: string }
      color: { attach: string; args: [ColorRepresentation] }
      ambientLight: Object3DNode<AmbientLight, typeof AmbientLight>
      directionalLight: Object3DNode<DirectionalLight, typeof DirectionalLight>
      group: Object3DNode<Group, typeof Group>
      mesh: Object3DNode<Mesh, typeof Mesh>
      line: Object3DNode<Line, typeof Line>
      bufferGeometry: Object3DNode<BufferGeometry, typeof BufferGeometry>
      sphereGeometry: Object3DNode<BufferGeometry, typeof BufferGeometry>
      meshStandardMaterial: MaterialNode<Material, typeof Material>
      meshBasicMaterial: MaterialNode<Material, typeof Material>
      lineBasicMaterial: MaterialNode<Material, typeof Material>
      bufferAttribute: { attach: string; array: Float32Array; count: number; itemSize: number }
    }
  }
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    ambientLight: Object3DNode<AmbientLight, typeof AmbientLight>
    directionalLight: Object3DNode<DirectionalLight, typeof DirectionalLight>
    group: Object3DNode<Group, typeof Group>
    mesh: Object3DNode<Mesh, typeof Mesh>
    line: Object3DNode<Line, typeof Line>
    bufferGeometry: Object3DNode<BufferGeometry, typeof BufferGeometry>
    sphereGeometry: Object3DNode<BufferGeometry, typeof BufferGeometry>
    meshStandardMaterial: MaterialNode<Material, typeof Material>
    meshBasicMaterial: MaterialNode<Material, typeof Material>
    lineBasicMaterial: MaterialNode<Material, typeof Material>
    bufferAttribute: { attach: string; array: Float32Array; count: number; itemSize: number }
    color: { attach: string; args: [ColorRepresentation] }
  }
}