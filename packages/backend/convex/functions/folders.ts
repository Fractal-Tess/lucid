import { v } from 'convex/values';

import { mutation, query } from '../_generated/server';

export const listBySubject = query({
  args: {
    subjectId: v.id('subjects'),
  },
  handler: async (ctx, args) => {
    const folders = await ctx.db
      .query('folders')
      .withIndex('by_subject', (q) => q.eq('subjectId', args.subjectId))
      .collect();

    return folders.sort((a, b) => a.order - b.order);
  },
});

export const listByParent = query({
  args: {
    parentId: v.optional(v.id('folders')),
  },
  handler: async (ctx, args) => {
    const folders = await ctx.db
      .query('folders')
      .withIndex('by_parent', (q) => q.eq('parentId', args.parentId))
      .collect();

    return folders.sort((a, b) => a.order - b.order);
  },
});

export const listRootFolders = query({
  args: {
    subjectId: v.id('subjects'),
  },
  handler: async (ctx, args) => {
    const allFolders = await ctx.db
      .query('folders')
      .withIndex('by_subject', (q) => q.eq('subjectId', args.subjectId))
      .collect();

    const rootFolders = allFolders.filter((f) => f.parentId === undefined);
    return rootFolders.sort((a, b) => a.order - b.order);
  },
});

export const get = query({
  args: {
    id: v.id('folders'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithPath = query({
  args: {
    id: v.id('folders'),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.id);
    if (!folder) return null;

    const path: Array<{ id: string; name: string }> = [];
    let current = folder;

    while (current) {
      path.unshift({ id: current._id, name: current.name });
      if (current.parentId) {
        const parent = await ctx.db.get(current.parentId);
        if (parent) {
          current = parent;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return { folder, path };
  },
});

export const create = mutation({
  args: {
    userId: v.id('users'),
    subjectId: v.id('subjects'),
    parentId: v.optional(v.id('folders')),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const siblingFolders = await ctx.db
      .query('folders')
      .withIndex('by_parent', (q) => q.eq('parentId', args.parentId))
      .collect();

    const sameSubjectSiblings = siblingFolders.filter(
      (f) => f.subjectId === args.subjectId,
    );
    const maxOrder = sameSubjectSiblings.reduce(
      (max, f) => Math.max(max, f.order),
      -1,
    );

    const id = await ctx.db.insert('folders', {
      userId: args.userId,
      subjectId: args.subjectId,
      parentId: args.parentId,
      name: args.name,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('folders'),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error('Folder not found');
    }

    const filteredUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) filteredUpdates.name = updates.name;

    await ctx.db.patch(id, filteredUpdates);
    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id('folders'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Folder not found');
    }

    const childFolders = await ctx.db
      .query('folders')
      .withIndex('by_parent', (q) => q.eq('parentId', args.id))
      .collect();

    for (const child of childFolders) {
      const documents = await ctx.db
        .query('documents')
        .withIndex('by_folder', (q) => q.eq('folderId', child._id))
        .collect();

      for (const doc of documents) {
        await ctx.db.patch(doc._id, { folderId: undefined });
      }

      await ctx.db.delete(child._id);
    }

    const documents = await ctx.db
      .query('documents')
      .withIndex('by_folder', (q) => q.eq('folderId', args.id))
      .collect();

    for (const doc of documents) {
      await ctx.db.patch(doc._id, { folderId: undefined });
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const reorder = mutation({
  args: {
    userId: v.id('users'),
    parentId: v.optional(v.id('folders')),
    orderedIds: v.array(v.id('folders')),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      const id = args.orderedIds[i];
      const folder = await ctx.db.get(id);

      if (!folder) {
        throw new Error(`Folder ${id} not found`);
      }

      if (folder.userId !== args.userId) {
        throw new Error("Unauthorized: Cannot reorder another user's folders");
      }

      await ctx.db.patch(id, { order: i });
    }

    return true;
  },
});

export const move = mutation({
  args: {
    id: v.id('folders'),
    newParentId: v.optional(v.id('folders')),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.id);
    if (!folder) {
      throw new Error('Folder not found');
    }

    if (args.newParentId === args.id) {
      throw new Error('Cannot move folder into itself');
    }

    if (args.newParentId) {
      let checkId = args.newParentId as typeof args.newParentId | undefined;
      while (checkId) {
        if (checkId === args.id) {
          throw new Error('Cannot move folder into its own descendant');
        }
        const parentFolder = await ctx.db.get(checkId);
        if (!parentFolder) break;
        checkId = parentFolder.parentId;
      }
    }

    const targetSiblings = await ctx.db
      .query('folders')
      .withIndex('by_parent', (q) => q.eq('parentId', args.newParentId))
      .collect();

    const sameSubjectSiblings = targetSiblings.filter(
      (f) => f.subjectId === folder.subjectId,
    );
    const maxOrder = sameSubjectSiblings.reduce(
      (max, f) => Math.max(max, f.order),
      -1,
    );

    await ctx.db.patch(args.id, {
      parentId: args.newParentId,
      order: maxOrder + 1,
    });

    return args.id;
  },
});
