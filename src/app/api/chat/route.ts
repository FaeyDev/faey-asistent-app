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
    const { message, history } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    const zai = await getZAIInstance()

    // Build messages array with system prompt and history
    const messages = [
      {
        role: 'assistant',
        content: 'You are a helpful and intelligent AI assistant. You can help with coding, writing, answering questions, and various tasks. Be thorough, accurate, and provide practical solutions. Respond in the same language as the user.'
      }
    ]

    // Add conversation history (limit to last 10 messages to avoid token limits)
    if (Array.isArray(history)) {
      messages.push(...history.slice(-10))
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    })

    const completion = await zai.chat.completions.create({
      messages: messages,
      thinking: { type: 'disabled' }
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error('Empty response from AI')
    }

    return NextResponse.json({
      success: true,
      response: response
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process request'
      },
      { status: 500 }
    )
  }
}
