export const TREE_CTX = 'TREE_CONTEXT';

export interface TreeContext {
  onRename: (
    id: string,
    type: 'folder' | 'document' | 'generation',
    currentName: string,
  ) => void;
  onDelete: (id: string, type: 'folder' | 'document' | 'generation') => void;
  onMove: (id: string, type: 'folder' | 'document') => void;
  onDownload: (id: string, name: string) => void;
  onUpload: (file: File, folderId?: string) => Promise<void>;
}
