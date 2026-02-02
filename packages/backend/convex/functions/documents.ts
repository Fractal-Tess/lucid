import { v } from 'convex/values';

import { api } from '../_generated/api';
import { mutation, query, action } from '../_generated/server';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const list = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('documents')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();
  },
});

export const listByFolder = query({
  args: {
    folderId: v.optional(v.id('folders')),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('documents')
      .withIndex('by_folder', (q) => q.eq('folderId', args.folderId))
      .collect();
  },
});

export const listRoot = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const allDocs = await ctx.db
      .query('documents')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    return allDocs.filter((d) => d.folderId === undefined);
  },
});

export const get = query({
  args: {
    id: v.id('documents'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getDownloadUrl = query({
  args: {
    documentId: v.id('documents'),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error('Document not found');

    return await ctx.storage.getUrl(doc.storageId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    userId: v.id('users'),
    folderId: v.optional(v.id('folders')),
    name: v.string(),
    storageId: v.id('_storage'),
    mimeType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.size > MAX_FILE_SIZE) {
      throw new Error(
        `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(args.mimeType)) {
      throw new Error(
        `Invalid file type: ${args.mimeType}. Allowed: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP`,
      );
    }

    const id = await ctx.db.insert('documents', {
      userId: args.userId,
      folderId: args.folderId,
      name: args.name,
      storageId: args.storageId,
      mimeType: args.mimeType,
      size: args.size,
      status: 'pending',
      createdAt: Date.now(),
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('documents'),
    name: v.optional(v.string()),
    folderId: v.optional(v.union(v.id('folders'), v.null())),
  },
  handler: async (ctx, args) => {
    const { id, folderId, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error('Document not found');
    }

    const filteredUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) filteredUpdates.name = updates.name;
    if (folderId !== undefined) {
      filteredUpdates.folderId = folderId === null ? undefined : folderId;
    }

    await ctx.db.patch(id, filteredUpdates);
    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id('documents'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Document not found');
    }

    await ctx.storage.delete(existing.storageId);

    const generations = await ctx.db
      .query('generations')
      .filter((q) => q.eq(q.field('sourceDocumentIds'), [args.id]))
      .collect();

    for (const gen of generations) {
      await ctx.db.delete(gen._id);
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id('documents'),
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
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error('Document not found');
    }

    await ctx.db.patch(id, updates);
    return id;
  },
});

export const moveToFolder = mutation({
  args: {
    id: v.id('documents'),
    folderId: v.optional(v.id('folders')),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new Error('Document not found');
    }

    await ctx.db.patch(args.id, { folderId: args.folderId });
    return args.id;
  },
});
