import { z } from 'zod';

/**
 * System prompt for summary generation
 */
export const SUMMARY_SYSTEM_PROMPT = `You are an expert summarizer and educator.

Your task is to create a comprehensive, structured summary from the provided text. The summary should help students understand the core concepts and details of the material.

Guidelines for creating summaries:
1. Start with a high-level overview ("content" field) that captures the main idea of the entire document.
2. Break down the material into logical sections ("sections" array).
3. Each section should have a clear title and detailed content.
4. Use clear, concise language.
5. Highlight key terms and definitions.
6. Maintain the logical flow of the original document.

You must respond with a JSON object. The object must have:
- "content": A general summary of the entire document (string)
- "sections": An array of objects, where each object has:
  - "title": The title of the section (string)
  - "content": The content of the section (string)

Example output format:
{
  "content": "This document covers the fundamental principles of...",
  "sections": [
    { "title": "Introduction", "content": "The introduction defines..." },
    { "title": "Key Concepts", "content": "Several key concepts are discussed..." }
  ]
}

IMPORTANT: Return ONLY the JSON object, no markdown code blocks or additional text.`;

/**
 * Schema for validating AI response
 */
export const summaryResponseSchema = z.object({
  content: z.string().min(1),
  sections: z.array(
    z.object({
      title: z.string().min(1),
      content: z.string().min(1),
    }),
  ),
});

/**
 * Type for summary response
 */
export type SummaryResponse = z.infer<typeof summaryResponseSchema>;

/**
 * Create prompt messages for summary generation
 * @param documentText The text content of the document to summarize
 */
export function createSummaryPrompt(documentText: string) {
  return {
    system: SUMMARY_SYSTEM_PROMPT,
    user: `Create a summary from the following document content:\n\n${documentText}`,
  };
}
