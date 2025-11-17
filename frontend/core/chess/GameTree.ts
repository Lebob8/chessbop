import type { GameNode, Move } from "./types";

/**
 * Game tree implementation for chess analysis with variation support
 */
export class GameTree {
  private root: GameNode;
  private current: GameNode;
  private nodeCounter: number = 0;

  constructor(initialFen: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
    this.root = {
      id: this.generateId(),
      fen: initialFen,
      move: null,
      parent: null,
      children: [],
      moveNumber: 0,
    };
    this.current = this.root;
  }

  /**
   * Generate unique ID for nodes
   */
  private generateId(): string {
    return `node_${this.nodeCounter++}`;
  }

  /**
   * Get the root node
   */
  getRoot(): GameNode {
    return this.root;
  }

  /**
   * Get the current node
   */
  getCurrent(): GameNode {
    return this.current;
  }

  /**
   * Set the current node by ID
   */
  setCurrentById(id: string): boolean {
    const node = this.findNodeById(this.root, id);
    if (node) {
      this.current = node;
      return true;
    }
    return false;
  }

  /**
   * Find a node by ID (recursive search)
   */
  private findNodeById(node: GameNode, id: string): GameNode | null {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = this.findNodeById(child, id);
      if (found) return found;
    }
    return null;
  }

  /**
   * Add a move from the current position
   * If the move already exists as a child, navigate to it
   * Otherwise, create a new variation
   */
  addMove(move: Move, fen: string): GameNode {
    // Check if this move already exists as a child
    const existingChild = this.current.children.find(
      (child) => child.move?.san === move.san
    );

    if (existingChild) {
      // Move already exists, navigate to it
      this.current = existingChild;
      return existingChild;
    }

    // Calculate move number
    const moveNumber =
      move.color === "w"
        ? this.current.moveNumber + 1
        : this.current.moveNumber;

    // Create new node
    const newNode: GameNode = {
      id: this.generateId(),
      fen,
      move,
      parent: this.current,
      children: [],
      moveNumber,
    };

    // Add as child (creates variation if not first child)
    this.current.children.push(newNode);
    this.current = newNode;

    return newNode;
  }

  /**
   * Navigate to parent node
   */
  goBack(): boolean {
    if (this.current.parent) {
      this.current = this.current.parent;
      return true;
    }
    return false;
  }

  /**
   * Navigate to first child (main line)
   */
  goForward(): boolean {
    if (this.current.children.length > 0) {
      this.current = this.current.children[0];
      return true;
    }
    return false;
  }

  /**
   * Navigate to specific child by index
   */
  goToChild(index: number): boolean {
    if (index >= 0 && index < this.current.children.length) {
      this.current = this.current.children[index];
      return true;
    }
    return false;
  }

  /**
   * Navigate to the start (root)
   */
  goToStart(): void {
    this.current = this.root;
  }

  /**
   * Navigate to the end of the main line
   */
  goToEnd(): void {
    while (this.current.children.length > 0) {
      this.current = this.current.children[0]; // Follow main line (first child)
    }
  }

  /**
   * Get the path from root to current node
   */
  getCurrentPath(): GameNode[] {
    const path: GameNode[] = [];
    let node: GameNode | null = this.current;
    while (node) {
      path.unshift(node);
      node = node.parent;
    }
    return path;
  }

  /**
   * Get the main line (first child at each node) from root to end
   */
  getMainLine(): GameNode[] {
    const mainLine: GameNode[] = [this.root];
    let node = this.root;
    while (node.children.length > 0) {
      node = node.children[0];
      mainLine.push(node);
    }
    return mainLine;
  }

  /**
   * Get all moves from root to current position
   */
  getMovesToCurrent(): Move[] {
    return this.getCurrentPath()
      .slice(1) // Skip root
      .map((node) => node.move!)
      .filter((move) => move !== null);
  }

  /**
   * Delete a variation (removes a child and its descendants)
   */
  deleteVariation(nodeId: string): boolean {
    const node = this.findNodeById(this.root, nodeId);
    if (!node || !node.parent || node.parent === this.root) {
      return false; // Can't delete root or root's main line
    }

    const parent = node.parent;
    const index = parent.children.indexOf(node);
    if (index === -1) return false;

    // If current node is in the subtree being deleted, move to parent
    if (this.isDescendantOf(this.current, node)) {
      this.current = parent;
    }

    parent.children.splice(index, 1);
    return true;
  }

  /**
   * Check if a node is a descendant of another
   */
  private isDescendantOf(node: GameNode, ancestor: GameNode): boolean {
    let current: GameNode | null = node;
    while (current) {
      if (current === ancestor) return true;
      current = current.parent;
    }
    return false;
  }

  /**
   * Promote a variation to main line (move it to first position among siblings)
   */
  promoteVariation(nodeId: string): boolean {
    const node = this.findNodeById(this.root, nodeId);
    if (!node || !node.parent) return false;

    const parent = node.parent;
    const index = parent.children.indexOf(node);
    if (index === -1 || index === 0) return false; // Already main line

    // Move to first position
    parent.children.splice(index, 1);
    parent.children.unshift(node);
    return true;
  }

  /**
   * Add a comment to the current node
   */
  addComment(comment: string): void {
    this.current.comment = comment;
  }

  /**
   * Reset the tree to initial position
   */
  reset(initialFen: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"): void {
    this.nodeCounter = 0;
    this.root = {
      id: this.generateId(),
      fen: initialFen,
      move: null,
      parent: null,
      children: [],
      moveNumber: 0,
    };
    this.current = this.root;
  }

  /**
   * Get number of variations at current position
   */
  getVariationCount(): number {
    return this.current.children.length;
  }

  /**
   * Check if current node has variations
   */
  hasVariations(): boolean {
    return this.current.children.length > 1;
  }

  /**
   * Get the index of current node among its siblings (for variation numbering)
   */
  getCurrentVariationIndex(): number {
    if (!this.current.parent) return 0;
    return this.current.parent.children.indexOf(this.current);
  }
}
