/// <reference types="vite/client" />

/**
 * Module exports for convex-test in monorepo setups.
 * This uses import.meta.glob to find all Convex function files.
 */
export const modules = import.meta.glob("./**/!(*.*.*)*.*s");
