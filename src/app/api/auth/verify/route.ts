import { NextRequest, NextResponse } from 'next/server'
import { verifyPrivyToken } from '@/lib/privy-server'

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    const verifiedClaims = await verifyPrivyToken(accessToken)

    if (!verifiedClaims) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: verifiedClaims.userId,
        appId: verifiedClaims.appId,
        sessionId: verifiedClaims.sessionId,
      },
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ error: 'Token verification failed' }, { status: 500 })
  }
}
