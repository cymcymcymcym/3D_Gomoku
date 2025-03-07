export class BoardState {
  private readonly size: number;
  private state: number[][][][]; // [2][depth][height][width] for current player and opponent pieces
  private lastMove: number[][][]; // [depth][height][width] for last move indicator
  private isBlackTurn: boolean;

  constructor(size: number) {
    this.size = size;
    this.isBlackTurn = true;
    
    // Initialize empty board state
    this.state = Array(2).fill(null).map(() => 
      Array(size).fill(null).map(() => 
        Array(size).fill(null).map(() => 
          Array(size).fill(0)
        )
      )
    );

    // Initialize last move tracker
    this.lastMove = Array(size).fill(null).map(() => 
      Array(size).fill(null).map(() => 
        Array(size).fill(0)
      )
    );
  }

  getCurrentState(): number[][][][] {
    // Format: [4][depth][height][width]
    // Channel 0: current player's pieces
    // Channel 1: opponent's pieces
    // Channel 2: last move
    // Channel 3: current player is black (1) or white (0)
    return [
      this.state[0], // Current player
      this.state[1], // Opponent
      this.lastMove, // Last move
      Array(this.size).fill(null).map(() => 
        Array(this.size).fill(null).map(() => 
          Array(this.size).fill(this.isBlackTurn ? 1 : 0)
        )
      )
    ];
  }

  makeMove(depth: number, height: number, width: number): boolean {
    if (this.state[0][depth][height][width] !== 0 || 
        this.state[1][depth][height][width] !== 0) {
      return false;
    }

    // Clear previous last move
    for (let d = 0; d < this.size; d++) {
      for (let h = 0; h < this.size; h++) {
        for (let w = 0; w < this.size; w++) {
          this.lastMove[d][h][w] = 0;
        }
      }
    }

    // Set the piece
    this.state[0][depth][height][width] = 1;
    this.lastMove[depth][height][width] = 1;

    // Swap perspectives
    [this.state[0], this.state[1]] = [this.state[1], this.state[0]];
    this.isBlackTurn = !this.isBlackTurn;

    return true;
  }

  positionToIndex(depth: number, height: number, width: number): number {
    return depth * this.size * this.size + height * this.size + width;
  }

  indexToPosition(index: number): [number, number, number] {
    const depth = Math.floor(index / (this.size * this.size));
    const remainder = index % (this.size * this.size);
    const height = Math.floor(remainder / this.size);
    const width = remainder % this.size;
    return [depth, height, width];
  }

  getAvailableMoves(): number[] {
    const moves: number[] = [];
    for (let d = 0; d < this.size; d++) {
      for (let h = 0; h < this.size; h++) {
        for (let w = 0; w < this.size; w++) {
          if (this.state[0][d][h][w] === 0 && this.state[1][d][h][w] === 0) {
            moves.push(this.positionToIndex(d, h, w));
          }
        }
      }
    }
    return moves;
  }

  reset() {
    // Reset all arrays to initial state
    for (let p = 0; p < 2; p++) {
      for (let d = 0; d < this.size; d++) {
        for (let h = 0; h < this.size; h++) {
          for (let w = 0; w < this.size; w++) {
            this.state[p][d][h][w] = 0;
          }
        }
      }
    }

    for (let d = 0; d < this.size; d++) {
      for (let h = 0; h < this.size; h++) {
        for (let w = 0; w < this.size; w++) {
          this.lastMove[d][h][w] = 0;
        }
      }
    }

    this.isBlackTurn = true;
  }
}