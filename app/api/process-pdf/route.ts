import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF (simplified - in production use pdf-parse or similar)
    const pdfText = `Sample medical text about cardiovascular system, including heart anatomy, blood circulation, and cardiac physiology.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Analyze this medical/educational document text and extract the key concepts to create a mind map structure.

Document text:
${pdfText}

Return a JSON object with this structure:
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "default",
      "position": {"x": number, "y": number},
      "data": {"label": "Concept Name"}
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "type": "smoothstep"
    }
  ]
}

Guidelines:
- Identify 8-15 main concepts from the document
- Create a central node for the main topic
- Arrange supporting concepts around it hierarchically
- Use clear, concise labels (2-5 words)
- Position nodes to avoid overlap (spread across 800x600 canvas)
- Connect related concepts with edges
- Focus on medical terminology and relationships

Return ONLY the JSON object, no other text.`,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const mindMapData = JSON.parse(jsonText);

    return NextResponse.json(mindMapData);
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    );
  }
}
