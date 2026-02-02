export type FileNodeType =
  | 'group'
  | 'subject'
  | 'folder'
  | 'document'
  | 'generation';

export interface FileNode {
  id: string;
  type: FileNodeType;
  name: string;
  children?: FileNode[];
  expanded?: boolean;
  icon?: any;
  color?: string;
  metadata?: Record<string, any>;
}

export type FileTreeData = FileNode[];

export interface FileTreeEvents {
  onSelect: (node: FileNode) => void;
  onToggle: (node: FileNode, expanded: boolean) => void;
  onReorder: (
    nodeId: string,
    targetId: string,
    position: 'before' | 'after' | 'inside',
  ) => void;
}
