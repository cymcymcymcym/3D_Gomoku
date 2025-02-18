import { useState } from 'react';

interface LayerSelectorProps {
  size: number
  currentLayer: number | null
  onLayerChange: (layer: number | null) => void
}

const LayerSelector: React.FC<LayerSelectorProps> = ({ size, currentLayer, onLayerChange }) => {
  return (
    <div className="layer-selector">
      <button 
        className={currentLayer === null ? 'active' : ''} 
        onClick={() => onLayerChange(null)}
      >
        All Layers
      </button>
      <div className="layer-buttons">
        {Array.from({ length: size }).map((_, i) => (
          <button
            key={i}
            className={currentLayer === i ? 'active' : ''}
            onClick={() => onLayerChange(i)}
          >
            Layer {i}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LayerSelector;