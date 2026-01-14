import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

let zaiInstance: any = null

async function getZAIInstance() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

export async function POST(request: NextRequest) {
  try {
    const { image, question } = await request.json()

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Image data (base64) is required' },
        { status: 400 }
      )
    }

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      )
    }

    const zai = await getZAIInstance()

    // Prepare the message with image and question
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: question
          },
          {
            type: 'image_url',
            image_url: {
              url: image
            }
          }
        ]
      }
    ]

    const response = await zai.chat.completions.createVision({
      messages: messages,
      thinking: { type: 'disabled' }
    })

    const analysis = response.choices[0]?.message?.content

    if (!analysis) {
      throw new Error('No analysis result in response')
    }

    return NextResponse.json({
      success: true,
      analysis: analysis
    })
  } catch (error) {
    console.error('Image analysis API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze image'
      },
      { status: 500 }
    )
  }
}
