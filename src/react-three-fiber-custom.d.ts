// This file provides React Three Fiber custom JSX elements
import * as THREE from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      line: any;
      lineBasicMaterial: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      color: any;
      ambientLight: any;
      directionalLight: any;
      bufferGeometry: any;
    }
  }
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    line: any;
    lineBasicMaterial: any;
    sphereGeometry: any;
    meshStandardMaterial: any;
    meshBasicMaterial: any;
    mesh: any;
    group: any;
    color: any;
    ambientLight: any;
    directionalLight: any;
    bufferGeometry: any;
  }
}