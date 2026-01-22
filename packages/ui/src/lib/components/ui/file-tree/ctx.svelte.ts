import { getContext, setContext } from "svelte";
import type { FileNode, FileNodeType } from "./types.js";

const FILE_TREE_CTX = Symbol("FILE_TREE_CTX");

export interface FileTreeContextState {
  selectedId: string | null;
  expandedIds: Set<string>;
  draggedNodeId: string | null;
  indentSize: number;
  onSelect: (node: FileNode) => void;
  onToggle: (node: FileNode) => void;
  onReorder: (sourceId: string, targetId: string, position: "before" | "after" | "inside") => void;
}

export function setFileTreeContext(state: FileTreeContextState) {
  setContext(FILE_TREE_CTX, state);
}

export function getFileTreeContext() {
  return getContext<FileTreeContextState>(FILE_TREE_CTX);
}
