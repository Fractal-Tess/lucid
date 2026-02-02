import { v } from 'convex/values';

import { api } from '../_generated/api';
import { action, mutation, query } from '../_generated/server';

const DOCLING_URL = process.env.DOCLING_URL || 'http://localhost:8000';

export const getDocumentForProcessing = query({
  args: {
    documentId: v.id('documents'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

export const updateDocumentStatus = mutation({
  args: {
    documentId: v.id('documents'),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('ready'),
      v.literal('failed'),
    ),
    extractedText: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { documentId, ...updates } = args;
    await ctx.db.patch(documentId, updates);
  },
});

export const processDocument = action({
  args: {
    documentId: v.id('documents'),
  },
  handler: async (ctx, args) => {
    const updateStatus = api.workflows.processDocument.updateDocumentStatus;
    const getDoc = api.workflows.processDocument.getDocumentForProcessing;

    await ctx.runMutation(updateStatus, {
      documentId: args.documentId,
      status: 'processing' as const,
    });

    try {
      const document = await ctx.runQuery(getDoc, {
        documentId: args.documentId,
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const fileUrl = await ctx.storage.getUrl(document.storageId);
      if (!fileUrl) {
        throw new Error('Could not get file URL');
      }

      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
      }

      const fileBlob = await fileResponse.blob();
      const formData = new FormData();
      formData.append('file', fileBlob, document.name);

      const response = await fetch(`${DOCLING_URL}/extract`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Docling extraction failed: ${errorText}`);
      }

      const result = (await response.json()) as { text: string };

      await ctx.runMutation(updateStatus, {
        documentId: args.documentId,
        status: 'ready' as const,
        extractedText: result.text,
      });

      return { success: true, documentId: args.documentId };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await ctx.runMutation(updateStatus, {
        documentId: args.documentId,
        status: 'failed' as const,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  },
});

export const retryProcessing = action({
  args: {
    documentId: v.id('documents'),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; documentId?: string; error?: string }> => {
    const getDoc = api.workflows.processDocument.getDocumentForProcessing;

    const document = await ctx.runQuery(getDoc, {
      documentId: args.documentId,
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.status !== 'failed') {
      throw new Error('Can only retry failed documents');
    }

    return await ctx.runAction(api.workflows.processDocument.processDocument, {
      documentId: args.documentId,
    });
  },
});
