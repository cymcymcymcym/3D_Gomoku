import { PolicyValueNet } from './PolicyValueNet';

interface TreeNode {
  parent: TreeNode | null;
  children: Map<number, TreeNode>;
  visits: number;
  value: number;
  priors: Float32Array;
  position?: number;
}

export class MCTS {
  private readonly c_puct = 5;
  private readonly n_playout = 400;
  private readonly board_size: number;
  private readonly policy_value_net: PolicyValueNet;
  private root: TreeNode;

  constructor(board_size: number, policy_value_net: PolicyValueNet) {
    this.board_size = board_size;
    this.policy_value_net = policy_value_net;
    this.root = this.createNode(null);
  }

  private createNode(parent: TreeNode | null, position?: number): TreeNode {
    return {
      parent,
      children: new Map(),
      visits: 0,
      value: 0,
      priors: new Float32Array(this.board_size * this.board_size * this.board_size),
      position
    };
  }

  async getMove(board: number[][][][], temperature: number = 1e-3): Promise<number> {
    // Get policy and value prediction from the network
    const [actionProbs, _] = await this.policy_value_net.predict(board);
    
    // Create root node if needed
    if (!this.root.children.size) {
      this.root.priors = actionProbs;
    }

    // Perform MCTS simulations
    for (let i = 0; i < this.n_playout; i++) {
      await this.playout(board);
    }

    // Select move based on visit counts
    const moves: number[] = [];
    const visits: number[] = [];
    
    this.root.children.forEach((node, move) => {
      moves.push(move);
      visits.push(node.visits);
    });

    // Apply temperature
    if (temperature === 0) {
      const maxIndex = visits.indexOf(Math.max(...visits));
      return moves[maxIndex];
    }

    // Convert visits to probabilities
    const sum = visits.reduce((a, b) => a + b, 0);
    const probs = visits.map(v => Math.pow(v / sum, 1 / temperature));
    const probSum = probs.reduce((a, b) => a + b, 0);
    const normalized = probs.map(p => p / probSum);

    // Sample from the distribution
    let r = Math.random();
    let cumsum = 0;
    for (let i = 0; i < normalized.length; i++) {
      cumsum += normalized[i];
      if (r < cumsum) {
        return moves[i];
      }
    }

    return moves[moves.length - 1];
  }

  private async playout(board: number[][][][]): Promise<void> {
    let node = this.root;

    // Selection
    while (node.children.size > 0) {
      let maxUcb = -Infinity;
      let bestMove = -1;
      let bestChild: TreeNode | null = null;

      node.children.forEach((child, move) => {
        const ucb = this.getUCB(node, child);
        if (ucb > maxUcb) {
          maxUcb = ucb;
          bestMove = move;
          bestChild = child;
        }
      });

      if (!bestChild) break;
      node = bestChild;
    }

    // Expansion and Simulation
    const [actionProbs, value] = await this.policy_value_net.predict(board);
    node.priors = actionProbs;

    // Get available moves (assuming 0 in board means empty)
    const availableMoves: number[] = [];
    for (let i = 0; i < this.board_size * this.board_size * this.board_size; i++) {
      const [d, h, w] = this.indexToPosition(i);
      if (board[0][d][h][w] === 0 && board[1][d][h][w] === 0) {
        availableMoves.push(i);
      }
    }

    // Create child nodes for available moves
    availableMoves.forEach(move => {
      if (!node.children.has(move)) {
        node.children.set(move, this.createNode(node, move));
      }
    });

    // Backpropagation
    while (node) {
      node.visits += 1;
      node.value += value;
      node = node.parent!;
    }
  }

  private getUCB(parent: TreeNode, child: TreeNode): number {
    const prior = child.position !== undefined ? parent.priors[child.position] : 0;
    if (child.visits === 0) {
      return Infinity;
    }
    return child.value / child.visits + 
           this.c_puct * prior * Math.sqrt(parent.visits) / (1 + child.visits);
  }

  private indexToPosition(index: number): [number, number, number] {
    const d = Math.floor(index / (this.board_size * this.board_size));
    const remainder = index % (this.board_size * this.board_size);
    const h = Math.floor(remainder / this.board_size);
    const w = remainder % this.board_size;
    return [d, h, w];
  }

  updateWithMove(move: number): void {
    if (this.root.children.has(move)) {
      this.root = this.root.children.get(move)!;
      this.root.parent = null;
    } else {
      this.root = this.createNode(null);
    }
  }
}