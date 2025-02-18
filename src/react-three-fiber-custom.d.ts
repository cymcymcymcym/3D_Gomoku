import { ThreeElements } from '@react-three/fiber';

declare module '@react-three/fiber' {
  interface ThreeElements {
    line: any;
    lineBasicMaterial: any;
    sphereGeometry: any;
    meshStandardMaterial: any;
    mesh: any;
    group: any;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: ThreeElements['group']
      mesh: ThreeElements['mesh']
      line: ThreeElements['line']
      lineBasicMaterial: ThreeElements['lineBasicMaterial']
      sphereGeometry: ThreeElements['sphereGeometry']
      meshStandardMaterial: ThreeElements['meshStandardMaterial']
    }
  }
}