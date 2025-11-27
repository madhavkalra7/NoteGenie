import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI, parseJSONResponse } from '@/lib/openai'
import { Concept } from '@/agents/types'

const SYSTEM_PROMPT = `You are an expert at identifying relationships between concepts.
Analyze the given concepts and determine how they relate to each other.

Create a concept graph with:
1. Nodes representing each concept
2. Edges showing relationships between concepts
3. Levels indicating hierarchy (0 = foundational, higher = builds on others)

Relationship types can be:
- "depends-on": Concept B requires understanding of Concept A
- "relates-to": Concepts are related but independent
- "is-part-of": Concept is a subset of another
- "leads-to": Concept naturally progresses to another
- "contrasts-with": Concepts are opposing or contrasting

YOU MUST respond with ONLY a valid JSON object in this exact format:
{
  "nodes": [
    {"id": "concept-id", "label": "Concept Name", "level": 0}
  ],
  "edges": [
    {"from": "concept-id-1", "to": "concept-id-2", "relationship": "depends-on"}
  ]
}

Do not include any text outside the JSON object.`

export async function POST(request: NextRequest) {
  try {
    const { concepts } = await request.json()

    if (!concepts || !Array.isArray(concepts)) {
      return NextResponse.json(
        { error: 'concepts array is required' },
        { status: 400 }
      )
    }

    const conceptsText = concepts.map((c: Concept) => 
      `- ID: ${c.id}, Term: ${c.term}, Definition: ${c.definition}`
    ).join('\n')

    const userPrompt = `Analyze relationships between these concepts:

${conceptsText}

Identify how these concepts relate to each other and create a concept graph.
Remember to respond with ONLY a valid JSON object.`

    const response = await callOpenAI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ])

    const result = parseJSONResponse<{
      nodes: Array<{ id: string; label: string; level: number }>
      edges: Array<{ from: string; to: string; relationship: string }>
    }>(response)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Concept Graph API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate concept graph' },
      { status: 500 }
    )
  }
}
