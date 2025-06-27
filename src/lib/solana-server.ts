/**
 * Solana Server - Legacy Compatibility Layer
 * 
 * This file maintains backward compatibility for existing imports
 * while the codebase transitions to the new organized structure.
 * 
 * @deprecated Use direct imports from '@/lib/onchain' instead
 */

// Re-export everything from the new organized API
export * from './onchain'

// Legacy imports for any remaining internal dependencies
import { WorkRepository } from './repositories/work-repository'