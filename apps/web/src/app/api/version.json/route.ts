import { NextResponse } from 'next/server'

// Variables que se calculan solo una vez al iniciar el servidor
const SERVER_START_TIME = Date.now()
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || 
                 process.env.NEXT_BUILD_ID || 
                 SERVER_START_TIME.toString()

export async function GET() {
  try {
    return NextResponse.json({
      version: BUILD_ID,
      timestamp: SERVER_START_TIME,
      status: 'ok'
    })
  } catch (error) {
    console.error('Error getting version:', error)
    return NextResponse.json(
      { error: 'Failed to get version' },
      { status: 500 }
    )
  }
}
