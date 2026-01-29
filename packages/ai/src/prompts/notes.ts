import { z } from "zod";

/**
 * System prompt for notes generation
 */
export const NOTES_SYSTEM_PROMPT = `You are an expert note-taker and educator.

Your task is to extract structured, comprehensive notes from the provided document text. The notes should help students understand and review the material effectively.

Guidelines for creating notes:
1. Extract key concepts, definitions, and important information
2. Organize content in a clear, hierarchical structure using Markdown
3. Use headers (##, ###) to organize sections
4. Use bullet points and numbered lists for clarity
5. Highlight important terms using **bold** formatting
6. Include examples where relevant
7. Capture formulas, equations, and technical details accurately
8. Maintain the logical flow and structure of the original document

You must respond with a JSON object. The object must have:
- "content": The main notes content in Markdown format (string)
- "keyPoints": An array of key points/takeaways from the document (array of strings)

Example output format:
{
  "content": "## Introduction\\n\\nThis document covers...\\n\\n## Key Concepts\\n\\n- **Concept 1**: Description...\\n- **Concept 2**: Description...",
  "keyPoints": [
    "Key concept 1 is important because...",
    "The main formula is...",
    "Remember that..."
  ]
}

IMPORTANT: Return ONLY the JSON object, no markdown code blocks or additional text.`;

/**
 * Schema for validating AI response
 */
export const notesResponseSchema = z.object({
  content: z.string().min(1),
  keyPoints: z.array(z.string().min(1)),
});

/**
 * Type for notes response
 */
export type NotesResponse = z.infer<typeof notesResponseSchema>;

/**
 * Create prompt messages for notes generation
 * @param documentText The text content of the document to extract notes from
 */
export function createNotesPrompt(documentText: string) {
  return {
    system: NOTES_SYSTEM_PROMPT,
    user: `Create structured notes from the following document content:\n\n${documentText}`,
  };
}
