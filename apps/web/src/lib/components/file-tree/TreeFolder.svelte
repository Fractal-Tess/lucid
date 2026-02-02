<script lang="ts">
	import { Folder, ChevronRight, FolderOpen } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import TreeFile from './TreeFile.svelte';
	import TreeFolder from './TreeFolder.svelte';
	import type { Doc } from '@alpha/backend/convex/_generated/dataModel';
	import * as ContextMenu from '@alpha/ui/shadcn/context-menu';
	import { getContext } from 'svelte';
	import { TREE_CTX, type TreeContext } from './tree-context';

	interface Props {
		folder: Doc<'folders'>;
		subFolders: Doc<'folders'>[];
		documents: Doc<'documents'>[];
		generations: Doc<'generations'>[];
		level?: number;
		getFolderChildren: (id: string) => { folders: Doc<'folders'>[]; documents: Doc<'documents'>[]; generations: Doc<'generations'>[] };
	}

	let { folder, subFolders, documents, generations, level = 0, getFolderChildren }: Props = $props();
	
	const { onRename, onDelete, onMove, onUpload } = getContext<TreeContext>(TREE_CTX);

	let isOpen = $state(false);
	let isDraggingOver = $state(false);

	function toggle() {
		isOpen = !isOpen;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation(); // Stop bubbling to root
		isDraggingOver = true;
		if (!isOpen) isOpen = true; // Auto open on hover
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDraggingOver = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation(); // Stop bubbling to root
		isDraggingOver = false;
		
		if (e.dataTransfer?.files) {
			const files = Array.from(e.dataTransfer.files);
			files.forEach(file => {
				onUpload(file, folder._id);
			});
		}
	}

	const paddingLeft = $derived(level * 12 + 4);
</script>

<div>
	<ContextMenu.Root>
		<ContextMenu.Trigger>
			{#snippet child({ props }: { props: Record<string, unknown> })}
				<button
					{...props}
					onclick={toggle}
					class="flex items-center gap-2 py-1.5 px-2 text-sm text-foreground hover:bg-muted/50 rounded-md transition-colors w-full group text-left {isDraggingOver ? 'bg-muted ring-1 ring-primary' : ''}"
					style="padding-left: {level === 0 ? 8 : paddingLeft}px"
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
				>
					<ChevronRight
						class="size-4 shrink-0 transition-transform duration-200 text-muted-foreground {isOpen ? 'rotate-90' : ''}"
					/>
					{#if isOpen}
						<FolderOpen class="size-4 shrink-0 text-blue-500 fill-blue-500/20" />
					{:else}
						<Folder class="size-4 shrink-0 text-blue-500 fill-blue-500/20" />
					{/if}
					<span class="truncate font-medium">{folder.name}</span>
				</button>
			{/snippet}
		</ContextMenu.Trigger>
		<ContextMenu.Content>
			<ContextMenu.Item onclick={() => onRename(folder._id, 'folder', folder.name)}>Rename</ContextMenu.Item>
			<ContextMenu.Item onclick={() => onMove(folder._id, 'folder')}>Move to...</ContextMenu.Item>
			<ContextMenu.Separator />
			<ContextMenu.Item class="text-red-500" onclick={() => onDelete(folder._id, 'folder')}>Delete</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>

	{#if isOpen}
		<div transition:slide={{ duration: 200 }} class="overflow-hidden">
			<div class="flex flex-col border-l ml-[calc(var(--level-padding)+11px)] border-border/50">
				{#each subFolders as subFolder}
					{@const children = getFolderChildren(subFolder._id)}
					<TreeFolder
						folder={subFolder}
						subFolders={children.folders}
						documents={children.documents}
						generations={children.generations}
						level={level + 1}
						{getFolderChildren}
					/>
				{/each}

				{#each documents as doc}
					<div style="padding-left: {level === 0 ? 20 : paddingLeft + 12}px">
						<TreeFile
							name={doc.name}
							type="document"
							docType={doc.mimeType}
							id={doc._id}
							href="/documents/{doc._id}"
						/>
					</div>
				{/each}

				{#each generations as gen}
					<div style="padding-left: {level === 0 ? 20 : paddingLeft + 12}px">
						<TreeFile
							name={gen.name}
							type="generation"
							genType={gen.type}
							id={gen._id}
							href="/generations/{gen._id}"
						/>
					</div>
				{/each}

				{#if subFolders.length === 0 && documents.length === 0 && generations.length === 0}
					<div 
						class="text-xs text-muted-foreground/50 py-2 italic"
						style="padding-left: {level === 0 ? 28 : paddingLeft + 20}px"
					>
						Empty folder
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
