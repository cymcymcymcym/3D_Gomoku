// Types and Interfaces
export interface Position {
  x: number
  y: number
  z: number
}

// Color Theme Configuration
export interface ColorScheme {
  grid: {
    lines: string
    points: string
  }
  coordinates: {
    lines: string
    text: string
    textOutline: string
  }
}

export const COLORS: ColorScheme = {
  grid: {
    lines: '#999999', // Lighter grid lines for better visibility
    points: '#333333'
  },
  coordinates: {
    lines: '#1a1a1a',
    text: '#1a1a1a',
    textOutline: '#ffffff'
  }
};