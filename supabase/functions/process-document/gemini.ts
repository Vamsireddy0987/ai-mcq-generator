import { ChunkMetadata } from "./chunking.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
}

function getSystemPrompt(difficulty: string): string {
  let diffGuidance = "";
  if (difficulty === 'easy') {
    diffGuidance = "Target beginner level. Focus on direct concept understanding and single-step reasoning.";
  } else if (difficulty === 'hard') {
    diffGuidance = "Target higher-order thinking. Focus on analytical, scenario-based questions requiring deep understanding and synthesis.";
  } else {
    diffGuidance = "Target intermediate level. Focus on concept application and multi-concept understanding.";
  }

  return `You are an expert Educational Assessment Specialist. Your task is to generate high-quality multiple-choice questions from the provided text.
CRITICAL REQUIREMENTS:
1. ${diffGuidance}
2. The correct answer MUST be unambiguously correct.
3. The 3 distractors MUST be plausible but definitively incorrect.
4. Avoid "All of the above" or "None of the above".`;
}

// Step 3B: Single Chunk Generation
export async function generateQuestionsForChunk(
  chunk: ChunkMetadata, 
  difficulty: string, 
  count: number,
  retries = 3
): Promise<GeneratedQuestion[]> {
  if (!GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY environment variable.");
    return [];
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const systemInstruction = getSystemPrompt(difficulty);
  const userPrompt = `Extract exactly ${count} unique multiple-choice questions from the text below.
Text:
"""
${chunk.chunk_text}
"""`;

  const payload = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig: {
      response_mime_type: "application/json",
      response_schema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            question: { type: "STRING" },
            options: { type: "ARRAY", items: { type: "STRING" }, description: "Exactly 4 options" },
            correct_answer_index: { type: "INTEGER", description: "0, 1, 2, or 3" },
            explanation: { type: "STRING" }
          },
          required: ["question", "options", "correct_answer_index", "explanation"]
        }
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        console.warn(`[Gemini] Rate limit hit for chunk ${chunk.chunk_index}. Retrying...`);
        await new Promise(res => setTimeout(res, 2000));
        return generateQuestionsForChunk(chunk, difficulty, count, retries - 1);
      }
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textOutput) throw new Error("Empty response from Gemini");

    const parsed: GeneratedQuestion[] = JSON.parse(textOutput);
    
    // Validation Layer
    const validQuestions = parsed.filter(q => {
      return (
        q.question && q.question.length > 10 &&
        Array.isArray(q.options) && q.options.length === 4 &&
        q.options.every(o => o.length > 0) &&
        Number.isInteger(q.correct_answer_index) && 
        q.correct_answer_index >= 0 && q.correct_answer_index <= 3 &&
        q.explanation && q.explanation.length > 10
      );
    });

    console.log(`[Gemini] Extracted ${validQuestions.length} valid questions from chunk ${chunk.chunk_index}`);
    return validQuestions;
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`[Gemini] Retry chunk ${chunk.chunk_index} due to error: ${error.message}`);
      await new Promise(res => setTimeout(res, 2000)); // Exponential backoff in production, simple delay here
      return generateQuestionsForChunk(chunk, difficulty, count, retries - 1);
    }
    console.error(`[Gemini] Chunk ${chunk.chunk_index} failed completely after retries.`);
    return [];
  }
}

// Step 3C: Multi-Chunk Processing
export async function processAllChunks(
  chunks: ChunkMetadata[], 
  totalRequested: number, 
  difficulty: string
): Promise<GeneratedQuestion[]> {
  // Determine questions per chunk to guarantee distribution across the whole document
  const qsPerChunk = Math.max(1, Math.ceil(totalRequested / chunks.length));
  const allQuestions: GeneratedQuestion[] = [];
  
  // Concurrency limit of 3 to prevent rate limits
  const CONCURRENCY = 3;
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const batch = chunks.slice(i, i + CONCURRENCY);
    const promises = batch.map(chunk => generateQuestionsForChunk(chunk, difficulty, qsPerChunk));
    
    console.log(`[Gemini] Processing batch ${i/CONCURRENCY + 1} (${batch.length} chunks)...`);
    const results = await Promise.all(promises);
    
    for (const res of results) {
      allQuestions.push(...res);
    }
  }

  // Deduplication Layer
  const seen = new Set<string>();
  const uniqueQuestions: GeneratedQuestion[] = [];

  for (const q of allQuestions) {
    // Normalize string: lowercase and remove non-alphanumeric
    const normalized = q.question.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seen.has(normalized)) {
      seen.add(normalized);
      uniqueQuestions.push(q);
    }
  }

  console.log(`[Gemini] Total unique valid questions generated: ${uniqueQuestions.length}`);

  // Trim to exact totalRequested if we over-generated due to rounding in qsPerChunk
  return uniqueQuestions.slice(0, totalRequested);
}
