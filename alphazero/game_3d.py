from __future__ import print_function
import numpy as np

class Board3D(object):
    """3D board for the game"""

    def __init__(self, **kwargs):
        self.width = int(kwargs.get('width', 4))
        self.height = int(kwargs.get('height', 4))
        self.depth = int(kwargs.get('depth', 4))
        # board states stored as a dict,
        # key: move as location on the board,
        # value: player as pieces type
        self.states = {}
        # need how many pieces in a row to win
        self.n_in_row = int(kwargs.get('n_in_row', 4))
        self.players = [1, 2]  # player1 and player2

    def init_board(self, start_player=0):
        if min(self.width, self.height, self.depth) < self.n_in_row:
            raise Exception('board dimensions cannot be less than {}'.format(self.n_in_row))
        self.current_player = self.players[start_player]
        # keep available moves in a list
        self.availables = list(range(self.width * self.height * self.depth))
        self.states = {}
        self.last_move = -1

    def move_to_location(self, move):
        """Convert move index to (depth, height, width) coordinates"""
        d = move // (self.width * self.height)
        remainder = move % (self.width * self.height)
        h = remainder // self.width
        w = remainder % self.width
        return [d, h, w]

    def location_to_move(self, location):
        if len(location) != 3:
            return -1
        d, h, w = location
        move = d * (self.width * self.height) + h * self.width + w
        if move not in range(self.width * self.height * self.depth):
            return -1
        return move

    def current_state(self):
        """Return the board state from the perspective of the current player.
        state shape: 4*depth*height*width
        """
        square_state = np.zeros((4, self.depth, self.height, self.width))
        if self.states:
            moves, players = np.array(list(zip(*self.states.items())))
            move_curr = moves[players == self.current_player]
            move_oppo = moves[players != self.current_player]
            for move in move_curr:
                d, h, w = self.move_to_location(move)
                square_state[0][d][h][w] = 1.0
            for move in move_oppo:
                d, h, w = self.move_to_location(move)
                square_state[1][d][h][w] = 1.0
            # indicate the last move location
            if self.last_move != -1:
                d, h, w = self.move_to_location(self.last_move)
                square_state[2][d][h][w] = 1.0
        if len(self.states) % 2 == 0:
            square_state[3][:, :, :] = 1.0  # indicate the colour to play
        return square_state

    def do_move(self, move):
        self.states[move] = self.current_player
        self.availables.remove(move)
        self.current_player = self.players[0] if self.current_player == self.players[1] else self.players[1]
        self.last_move = move

    def has_a_winner(self):
        width = self.width
        height = self.height
        depth = self.depth
        states = self.states
        n = self.n_in_row

        moved = list(set(range(width * height * depth)) - set(self.availables))
        if len(moved) < self.n_in_row * 2 - 1:
            return False, -1

        for m in moved:
            d, h, w = self.move_to_location(m)
            player = states[m]

            # Check all 13 possible directions in 3D space
            directions = [
                # Straight lines along each axis
                [(0,0,1)], [(0,1,0)], [(1,0,0)],
                # Diagonal in each face
                [(0,1,1)], [(0,1,-1)],  # xy-plane
                [(1,0,1)], [(1,0,-1)],  # xz-plane
                [(1,1,0)], [(1,-1,0)],  # yz-plane
                # Main space diagonals
                [(1,1,1)], [(1,1,-1)], [(1,-1,1)], [(1,-1,-1)]
            ]

            for direction in directions:
                dx, dy, dz = direction[0]
                count = 0
                x, y, z = w, h, d
                
                # Count in positive direction
                while (0 <= x < width and 0 <= y < height and 0 <= z < depth and 
                       states.get(self.location_to_move([z, y, x])) == player):
                    count += 1
                    if count >= n:
                        return True, player
                    x, y, z = x + dx, y + dy, z + dz

                # Reset and count in negative direction
                x, y, z = w - dx, h - dy, d - dz
                while (0 <= x < width and 0 <= y < height and 0 <= z < depth and 
                       states.get(self.location_to_move([z, y, x])) == player):
                    count += 1
                    if count >= n:
                        return True, player
                    x, y, z = x - dx, y - dy, z - dz

        return False, -1

    def game_end(self):
        """Check whether the game is ended or not"""
        win, winner = self.has_a_winner()
        if win:
            return True, winner
        elif not len(self.availables):
            return True, -1
        return False, -1

    def get_current_player(self):
        return self.current_player


class Game3D(object):
    """3D game server"""

    def __init__(self, board, **kwargs):
        self.board = board

    def graphic(self, board, player1, player2):
        """Draw the board and show game info"""
        print("Player", player1, "with X".rjust(3))
        print("Player", player2, "with O".rjust(3))
        print("\nBoard state by depth level:")
        
        for d in range(board.depth):
            print(f"\nDepth level {d}:")
            print("   ", end="")
            for w in range(board.width):
                print("{0:4}".format(w), end="")
            print("\r\n")
            
            for h in range(board.height - 1, -1, -1):
                print("{0:4}".format(h), end="")
                for w in range(board.width):
                    loc = d * (board.width * board.height) + h * board.width + w
                    p = board.states.get(loc, -1)
                    if p == player1:
                        print('X'.center(4), end="")
                    elif p == player2:
                        print('O'.center(4), end="")
                    else:
                        print('_'.center(4), end="")
                print("\r\n")

    def start_play(self, player1, player2, start_player=0, is_shown=1):
        """start a game between two players"""
        if start_player not in (0, 1):
            raise Exception('start_player should be either 0 (player1 first) '
                            'or 1 (player2 first)')
        self.board.init_board(start_player)
        p1, p2 = self.board.players
        player1.set_player_ind(p1)
        player2.set_player_ind(p2)
        players = {p1: player1, p2: player2}
        if is_shown:
            self.graphic(self.board, player1.player, player2.player)
        while True:
            current_player = self.board.get_current_player()
            player_in_turn = players[current_player]
            move = player_in_turn.get_action(self.board)
            self.board.do_move(move)
            if is_shown:
                self.graphic(self.board, player1.player, player2.player)
            end, winner = self.board.game_end()
            if end:
                if is_shown:
                    if winner != -1:
                        print("Game end. Winner is", players[winner])
                    else:
                        print("Game end. Tie")
                return winner

    def start_self_play(self, player, is_shown=0, temp=1e-3):
        """ start a self-play game using a MCTS player, reuse the search tree,
        and store the self-play data: (state, mcts_probs, z) for training
        """
        self.board.init_board()
        p1, p2 = self.board.players
        states, mcts_probs, current_players = [], [], []
        while True:
            move, move_probs = player.get_action(self.board,
                                                 temp=temp,
                                                 return_prob=1)
            # store the data FOR EACH MOVE
            states.append(self.board.current_state())
            mcts_probs.append(move_probs)
            current_players.append(self.board.current_player)
            # perform a move
            self.board.do_move(move)
            if is_shown:
                self.graphic(self.board, p1, p2)
            end, winner = self.board.game_end()
            if end:
                # winner from the perspective of the current player of each state
                winners_z = np.zeros(len(current_players))
                if winner != -1:
                    winners_z[np.array(current_players) == winner] = 1.0
                    winners_z[np.array(current_players) != winner] = -1.0
                # reset MCTS root node
                player.reset_player()
                if is_shown:
                    if winner != -1:
                        print("Game end. Winner is player:", winner)
                    else:
                        print("Game end. Tie")
                return winner, zip(states, mcts_probs, winners_z)