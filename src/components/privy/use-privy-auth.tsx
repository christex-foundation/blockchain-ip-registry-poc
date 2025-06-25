'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useCallback } from 'react'

export function usePrivyAuth() {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    linkEmail,
    unlinkEmail,
    exportWallet,
    createWallet,
    getAccessToken: privyGetAccessToken,
  } = usePrivy()

  // Get the user's embedded Solana wallet
  const getSolanaWallet = useCallback(() => {
    if (!user?.wallet) return null
    
    // Find the embedded Solana wallet
    const solanaWallet = user.linkedAccounts.find(
      (account) => account.type === 'wallet' && account.chainType === 'solana'
    )
    
    return solanaWallet || null
  }, [user])

  // Get user's access token for API calls
  const getAccessToken = useCallback(async () => {
    if (!authenticated) {
      return null
    }
    
    try {
      const token = await privyGetAccessToken()
      return token
    } catch (error) {
      console.error('Error getting access token:', error)
      return null
    }
  }, [authenticated, privyGetAccessToken])

  // Login with email
  const loginWithEmail = useCallback(async () => {
    try {
      await login({ loginMethods: ['email'] })
    } catch (error) {
      console.error('Email login failed:', error)
      throw error
    }
  }, [login])

  // Create embedded wallet if user doesn't have one
  const ensureWallet = useCallback(async () => {
    if (!user) return null
    
    const solanaWallet = getSolanaWallet()
    if (solanaWallet) return solanaWallet
    
    try {
      const newWallet = await createWallet()
      return newWallet
    } catch (error) {
      console.error('Failed to create wallet:', error)
      throw error
    }
  }, [user, getSolanaWallet, createWallet])

  return {
    // State
    ready,
    authenticated,
    user,
    
    // Wallet info
    solanaWallet: getSolanaWallet(),
    
    // Actions
    login,
    logout,
    loginWithEmail,
    linkEmail,
    unlinkEmail,
    exportWallet,
    ensureWallet,
    getAccessToken,
    
    // User info
    userEmail: user?.email?.address || null,
    userId: user?.id || null,
  }
} 
