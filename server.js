import express from 'express';
import cors from 'cors';
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware with detailed game state
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  if (req.method === 'POST' && req.path === '/api/ai-move') {
    const { pieces } = req.body;
    console.log('Game state received:', {
      totalPieces: pieces?.length || 0,
      pieces: pieces?.map(p => ({
        position: p.position,
        color: p.color
      }))
    });
  }
  next();
});

// Game constants
const GRID_SIZE = 4;

// Helper function to check if a position is already occupied
function isPositionOccupied(position, pieces) {
  return pieces.some(p => 
    p.position.x === position.x && 
    p.position.y === position.y && 
    p.position.z === position.z
  );
}

// Helper function to evaluate a potential move
function evaluatePosition(pos, pieces) {
  // TODO: Implement actual move evaluation
  // For now, return a random score
  return Math.random();
}

// AI endpoint with improved move selection
app.post('/api/ai-move', (req, res) => {
  try {
    console.log('AI move request received');
    const { pieces } = req.body;
    
    if (!pieces || !Array.isArray(pieces)) {
      console.error('Invalid request - pieces not provided or not an array');
      return res.status(400).json({ error: 'Invalid request format' });
    }
    
    // Find all valid (empty) positions
    const validPositions = [];
    const positionScores = new Map();
    
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < GRID_SIZE; z++) {
          const pos = { x, y, z };
          if (!isPositionOccupied(pos, pieces)) {
            validPositions.push(pos);
            positionScores.set(JSON.stringify(pos), evaluatePosition(pos, pieces));
          }
        }
      }
    }
    
    console.log('Valid positions found:', validPositions.length);
    
    if (validPositions.length === 0) {
      console.error('No valid moves available');
      return res.status(400).json({ error: 'No valid moves available' });
    }
    
    // Sort positions by score and pick one of the top 3 randomly
    const sortedPositions = validPositions.sort((a, b) => 
      positionScores.get(JSON.stringify(b)) - positionScores.get(JSON.stringify(a))
    );
    
    const topN = Math.min(3, sortedPositions.length);
    const selectedMove = sortedPositions[Math.floor(Math.random() * topN)];
    
    console.log('Selected move:', selectedMove);
    
    // Small delay to simulate thinking
    setTimeout(() => {
      res.json({ move: selectedMove });
      console.log('AI move response sent');
    }, 300 + Math.random() * 400);
    
  } catch (error) {
    console.error('Error in AI move generation:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI move',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Server running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`AI Server running on port ${PORT}`);
});