// Utility function to convert lamports to SOL
export function lamportsToSol(lamports: number): number {
  return lamports / 1e9
}

// Utility function to convert SOL to lamports
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1e9)
}