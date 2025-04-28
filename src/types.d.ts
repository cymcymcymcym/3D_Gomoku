import { Object3DNode } from '@react-three/fiber'
import { Color, AmbientLight, DirectionalLight } from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      color: Object3DNode<Color, typeof Color>
      ambientLight: Object3DNode<AmbientLight, typeof AmbientLight>
      directionalLight: Object3DNode<DirectionalLight, typeof DirectionalLight>
      group: any
      mesh: any
      sphereGeometry: any
      meshStandardMaterial: any
      meshBasicMaterial: any
      bufferGeometry: any
    }
  }
}

// Make sure this is treated as a module
export {} 