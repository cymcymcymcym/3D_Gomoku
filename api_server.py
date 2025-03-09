from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
import tensorflow as tf
import logging
import time
import sys
import traceback

# Add alphazero directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'alphazero'))

# Import alphazero modules
from alphazero.game_3d import Board3D, Game3D
from alphazero.mcts_alphaZero_3d import MCTSPlayer
from alphazero.policy_value_net_tf2_3d import PolicyValueNet3D

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("GomokuAPI")

# Suppress TF logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"  # Use CPU
tf.get_logger().setLevel(logging.ERROR)
tf.keras.utils.disable_interactive_logging()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Game parameters
GRID_SIZE = 4
N_IN_ROW = 4  # Number in a row to win
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'alphazero/policy_3d_iter_100_2nd.weights.h5')

# Global variables to cache the model
best_policy = None
mcts_player = None

def initialize_ai():
    """Initialize the AI model and player"""
    global best_policy, mcts_player
    
    if best_policy is not None:
        return
    
    logger.info("Initializing AI model...")
    
    try:
        # Initialize the neural network
        best_policy = PolicyValueNet3D(GRID_SIZE, GRID_SIZE, GRID_SIZE)
        
        # Build model with dummy input
        dummy_state = np.zeros((1, 4, GRID_SIZE, GRID_SIZE, GRID_SIZE))
        best_policy(dummy_state)
        
        # Load pre-trained weights
        best_policy.load_weights(MODEL_PATH)
        logger.info("Model loaded successfully")
        
        # Create the AI player
        mcts_player = MCTSPlayer(
            best_policy.policy_value_fn,
            c_puct=4,
            n_playout=200,  # Higher playouts for better performance
            is_selfplay=0  # Make sure this is 0 for human play
        )
        mcts_player.set_player_ind(1)  # AI is player 1 (white)
        
        logger.info("AI initialization complete")
    except Exception as e:
        logger.error(f"Error initializing AI: {str(e)}")
        logger.error(traceback.format_exc())
        raise

def frontend_to_board(pieces):
    """Convert frontend piece representation to backend board state"""
    # Create a new board
    board = Board3D(width=GRID_SIZE, height=GRID_SIZE, depth=GRID_SIZE, n_in_row=N_IN_ROW)
    board.init_board(0)  # Initialize with black as first player
    
    # Place all pieces on the board in the correct sequence
    black_pieces = [p for p in pieces if p['color'] == 'black']
    white_pieces = [p for p in pieces if p['color'] == 'white']
    
    # Black always starts, so we should have equal or one more black piece
    if len(black_pieces) < len(white_pieces):
        raise ValueError("Invalid game state: white has more pieces than black")
    
    if len(black_pieces) > len(white_pieces) + 1:
        raise ValueError("Invalid game state: black has too many extra pieces")
    
    # Place pieces in alternating order
    for i in range(max(len(black_pieces), len(white_pieces))):
        # Place black piece if available
        if i < len(black_pieces):
            piece = black_pieces[i]
            pos = (piece['position']['z'], piece['position']['y'], piece['position']['x'])
            move = board.location_to_move(pos)
            board.do_move(move)
        
        # Place white piece if available
        if i < len(white_pieces):
            piece = white_pieces[i]
            pos = (piece['position']['z'], piece['position']['y'], piece['position']['x'])
            move = board.location_to_move(pos)
            board.do_move(move)
    
    return board

def get_ai_move(board):
    """Get the AI's next move using MCTS"""
    move = mcts_player.get_action(board)
    location = board.move_to_location(move)
    return {
        'z': int(location[0]),  # Convert np.int64 to regular Python int
        'y': int(location[1]),  # Convert np.int64 to regular Python int 
        'x': int(location[2])   # Convert np.int64 to regular Python int
    }

@app.route('/api/ai-move', methods=['POST'])
def ai_move():
    start_time = time.time()
    request_id = request.json.get('requestId', 'unknown')
    
    logger.info(f"Received AI move request, ID: {request_id}")
    
    try:
        # Make sure the AI is initialized
        initialize_ai()
        
        # Get piece data from request
        pieces_data = request.json.get('pieces', [])
        logger.info(f"Received {len(pieces_data)} pieces")
        
        # Convert frontend representation to backend board
        board = frontend_to_board(pieces_data)
        
        # Check if the game is already over
        end, winner = board.game_end()
        if end:
            return jsonify({
                'error': 'Game is already over',
                'winner': winner
            }), 400
        
        # Get AI move
        logger.info("Computing AI move...")
        move_location = get_ai_move(board)
        
        # Convert to frontend coordinate system
        ai_move = {
            'x': move_location['x'],
            'y': move_location['y'],
            'z': move_location['z']
        }
        
        processing_time = time.time() - start_time
        logger.info(f"AI move computed in {processing_time:.2f} seconds: {ai_move}")
        
        return jsonify({
            'move': ai_move,
            'source': 'alphazero',
            'processingTime': processing_time
        })
        
    except Exception as e:
        logger.error(f"Error processing AI move: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'ok',
        'aiInitialized': best_policy is not None
    })

if __name__ == '__main__':
    try:
        # Initialize AI on startup
        initialize_ai()
        # Run Flask app
        logger.info("Starting API server on port 3002")
        app.run(host='0.0.0.0', port=3002, debug=False)
    except Exception as e:
        logger.critical(f"Failed to start server: {str(e)}")
        logger.critical(traceback.format_exc())