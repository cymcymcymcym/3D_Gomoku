from game_3d import Board3D, Game3D
from mcts_pure import MCTSPlayer as MCTS_Pure
from mcts_alphaZero_3d import MCTSPlayer  # Changed to use 3D version
from policy_value_net_tf2_3d import PolicyValueNet3D

import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

import numpy as np
import tensorflow as tf
import logging

# Suppress TF logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.get_logger().setLevel(logging.ERROR)
tf.keras.utils.disable_interactive_logging()

class Human:
    def __init__(self):
        self.player = None

    def set_player_ind(self, p):
        self.player = p

    def get_action(self, board):
        try:
            location = input("Your move (format - depth,height,width): ")
            if isinstance(location, str):
                location = [int(n, 10) for n in location.split(",")]
            move = board.location_to_move(location)
        except Exception as e:
            move = -1
        if move == -1 or move not in board.availables:
            print("Invalid move")
            move = self.get_action(board)
        return move

    def __str__(self):
        return "Human {}".format(self.player)

def run():
    n = 4  # Number in a row to win
    width, height, depth = 4, 4, 4  # 3D board size
    model_file = './policy_3d_iter_125.weights.h5'  # Model file for 3D
    
    try:
        # Initialize board and game
        board = Board3D(width=width, height=height, depth=depth, n_in_row=n)
        game = Game3D(board)

        # Initialize and load the TF2 model
        best_policy = PolicyValueNet3D(width, height, depth)
        try:
            # Build model with dummy input
            dummy_state = np.zeros((1, 4, depth, height, width))
            best_policy(dummy_state)
            
            best_policy.load_weights(model_file)
            print("Model loaded successfully")
        except Exception as e:
            print(f"Model not found. Will play with untrained model: {e}")

        # Create the AI player
        mcts_player = MCTSPlayer(
            best_policy.policy_value_fn,
            c_puct=5,
            n_playout=400,  # Higher playouts for better performance
            is_selfplay=0  # Make sure this is 0 for human play
        )

        # Create human player
        human = Human()

        # Let user choose who goes first
        while True:
            start_player = input("Do you want to go first? (y/n): ")
            if start_player.lower() == 'y':
                start_player = 0  # Human first
                break
            elif start_player.lower() == 'n':
                start_player = 1  # AI first
                break
            print("Please enter 'y' or 'n'")

        # Start the game
        game.start_play(human, mcts_player, start_player=start_player, is_shown=1)

    except KeyboardInterrupt:
        print('\nQuit')
    except Exception as e:
        print(f"\nGame error: {str(e)}")

if __name__ == '__main__':
    print("Welcome to 3D Gomoku!")
    print("Enter moves in the format: depth,height,width")
    print("For example: 1,2,3 means depth level 1, row 2, column 3")
    print("The game board is displayed as multiple 2D slices at each depth level")
    while True:
        run()
        again = input("Play again? (y/n): ")
        if again.lower() != 'y':
            break
