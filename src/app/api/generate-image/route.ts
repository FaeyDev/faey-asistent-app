import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

let zaiInstance: any = null

async function getZAIInstance() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

// Ensure output directory exists
const outputDir = path.join(process.cwd(), 'public', 'generated-images')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = '1024x1024' } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      )
    }

    const zai = await getZAIInstance()

    const response = await zai.images.generations.create({
      prompt: prompt,
      size: size
    })

    const imageBase64 = response.data[0]?.base64

    if (!imageBase64) {
      throw new Error('No image data in response')
    }

    // Convert base64 to buffer and save to file
    const buffer = Buffer.from(imageBase64, 'base64')
    const filename = `img_${Date.now()}.png`
    const filepath = path.join(outputDir, filename)

    fs.writeFileSync(filepath, buffer)

    // Return the public URL
    const imageUrl = `/generated-images/${filename}`

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt,
      size: size
    })
  } catch (error) {
    console.error('Image generation API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image'
      },
      { status: 500 }
    )
  }
}
