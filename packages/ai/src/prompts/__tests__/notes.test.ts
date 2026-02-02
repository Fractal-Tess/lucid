import { describe, it, expect } from 'vitest';

import {
  notesResponseSchema,
  createNotesPrompt,
  NOTES_SYSTEM_PROMPT,
} from '../notes';

describe('notes prompts', () => {
  describe('NOTES_SYSTEM_PROMPT', () => {
    it('should contain guidelines for creating notes', () => {
      expect(NOTES_SYSTEM_PROMPT).toContain(
        'extract structured, comprehensive notes',
      );
      expect(NOTES_SYSTEM_PROMPT).toContain('Markdown');
      expect(NOTES_SYSTEM_PROMPT).toContain('keyPoints');
    });

    it('should specify JSON output format', () => {
      expect(NOTES_SYSTEM_PROMPT).toContain('"content"');
      expect(NOTES_SYSTEM_PROMPT).toContain('"keyPoints"');
      expect(NOTES_SYSTEM_PROMPT).toContain('JSON object');
    });

    it('should include formatting instructions', () => {
      expect(NOTES_SYSTEM_PROMPT).toContain('headers');
      expect(NOTES_SYSTEM_PROMPT).toContain('bullet points');
      expect(NOTES_SYSTEM_PROMPT).toContain('bold');
    });
  });

  describe('notesResponseSchema', () => {
    it('should validate valid notes response', () => {
      const validResponse = {
        content: '## Introduction\n\nThis is the introduction.',
        keyPoints: ['Key point 1', 'Key point 2'],
      };

      const result = notesResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      const invalidResponse = {
        content: '',
        keyPoints: ['Key point'],
      };

      const result = notesResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject empty key points', () => {
      const invalidResponse = {
        content: 'Some content',
        keyPoints: [''],
      };

      const result = notesResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should accept empty keyPoints array', () => {
      const validResponse = {
        content: 'Some content',
        keyPoints: [],
      };

      const result = notesResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject missing fields', () => {
      const invalidResponse = {
        content: 'Some content',
      };

      const result = notesResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('createNotesPrompt', () => {
    it('should return system and user prompts', () => {
      const documentText = 'This is a sample document.';
      const prompts = createNotesPrompt(documentText);

      expect(prompts).toHaveProperty('system');
      expect(prompts).toHaveProperty('user');
      expect(prompts.system).toBe(NOTES_SYSTEM_PROMPT);
      expect(prompts.user).toContain(documentText);
    });

    it('should include document text in user prompt', () => {
      const documentText = 'Document content here';
      const prompts = createNotesPrompt(documentText);

      expect(prompts.user).toContain('Create structured notes');
      expect(prompts.user).toContain(documentText);
    });
  });
});
