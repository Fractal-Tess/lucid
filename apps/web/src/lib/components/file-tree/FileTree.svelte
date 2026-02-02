<script lang="ts">
	import type { Doc } from '@alpha/backend/convex/_generated/dataModel';
	import TreeFolder from './TreeFolder.svelte';
	import TreeFile from './TreeFile.svelte';
	import { setContext } from 'svelte';
	import { TREE_CTX, type TreeContext } from './tree-context';
	import * as ContextMenu from '@alpha/ui/shadcn/context-menu';

	interface Props extends TreeContext {
		folders: Doc<'folders'>[];
		documents: Doc<'documents'>[];
		generations: Doc<'generations'>[];
		onCreateFolder: () => void;
	}

	let { 
		folders, 
		documents, 
		generations,
		onRename,
		onDelete,
		onMove,
		onDownload,
		onUpload,
		onCreateFolder
	}: Props = $props();

	setContext(TREE_CTX, {
		onRename,
		onDelete,
		onMove,
		onDownload,
		onUpload
	});

	let sortBy = $state<'name' | 'date'>('name');
	let fileInput: HTMLInputElement;

	function handleContextMenuUpload() {
		fileInput?.click();
	}

	function handleFileInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files) {
			const files = Array.from(target.files);
			files.forEach(file => onUpload(file, undefined));
			target.value = ''; // Reset
		}
	}

	// Organize data into a map for O(1) access by parentId
	const folderMap = $derived.by(() => {
		const map = new Map<string | undefined, { folders: Doc<'folders'>[]; documents: Doc<'documents'>[]; generations: Doc<'generations'>[] }>();
		
		// Initialize root
		map.set(undefined, { folders: [], documents: [], generations: [] });

		// Add folders
		folders.forEach((f: Doc<'folders'>) => {
			const parentId = f.parentId; // undefined for root
			if (!map.has(parentId)) map.set(parentId, { folders: [], documents: [], generations: [] });
			map.get(parentId)!.folders.push(f);
			
			// Ensure this folder has an entry (so we can look up its children later)
			if (!map.has(f._id)) map.set(f._id, { folders: [], documents: [], generations: [] });
		});

		// Add documents
		documents.forEach((d: Doc<'documents'>) => {
			const folderId = d.folderId; // undefined for root
			if (!map.has(folderId)) map.set(folderId, { folders: [], documents: [], generations: [] });
			map.get(folderId)!.documents.push(d);
		});

		// Add generations
		generations.forEach((g: Doc<'generations'>) => {
			const folderId = g.folderId; // undefined not typical for gens but possible
			if (!map.has(folderId)) map.set(folderId, { folders: [], documents: [], generations: [] });
			map.get(folderId)!.generations.push(g);
		});

		return map;
	});

	function getChildren(id: string | undefined) {
		const children = folderMap.get(id) || { folders: [], documents: [], generations: [] };
		
		// Create shallow copies to avoid mutating the map values directly during sort
		const sortedFolders = [...children.folders];
		const sortedDocs = [...children.documents];
		const sortedGens = [...children.generations];

		if (sortBy === 'name') {
			sortedFolders.sort((a, b) => a.name.localeCompare(b.name));
			sortedDocs.sort((a, b) => a.name.localeCompare(b.name));
			sortedGens.sort((a, b) => a.name.localeCompare(b.name));
		} else {
			sortedFolders.sort((a, b) => b._creationTime - a._creationTime);
			sortedDocs.sort((a, b) => b._creationTime - a._creationTime);
			sortedGens.sort((a, b) => b._creationTime - a._creationTime);
		}

		return { folders: sortedFolders, documents: sortedDocs, generations: sortedGens };
	}

	const rootData = $derived(getChildren(undefined));

	// Drag and drop handlers for root
	let isDraggingOver = $state(false);

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDraggingOver = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDraggingOver = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDraggingOver = false;
		
		if (e.dataTransfer?.files) {
			const files = Array.from(e.dataTransfer.files);
			files.forEach(file => {
				onUpload(file, undefined); // Upload to root
			});
		}
	}
</script>

<input
	bind:this={fileInput}
	type="file"
	class="hidden"
	multiple
	onchange={handleFileInputChange}
/>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		{#snippet child({ props }: { props: Record<string, unknown> })}
			<div 
				{...props}
				class="w-full h-full select-none space-y-1 relative min-h-[200px] {isDraggingOver ? 'bg-muted-foreground/5 rounded-lg' : ''}"
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
				role="application"
			>
				{#if isDraggingOver}
					<div class="absolute inset-0 flex items-center justify-center z-50 pointer-events-none border-2 border-dashed border-primary rounded-lg bg-background/50">
						<span class="text-primary font-medium">Drop files to upload to root</span>
					</div>
				{/if}

				{#if folders.length === 0 && documents.length === 0 && generations.length === 0}
					<div class="flex flex-col items-center justify-center py-12 text-muted-foreground h-full">
						<p>No files found.</p>
						<p class="text-xs mt-2">Right click for options or drag and drop files</p>
					</div>
				{:else}
					{#each rootData.folders as folder}
						<TreeFolder
							{folder}
							subFolders={getChildren(folder._id).folders}
							documents={getChildren(folder._id).documents}
							generations={getChildren(folder._id).generations}
							getFolderChildren={(id) => getChildren(id)}
						/>
					{/each}

					{#each rootData.documents as doc}
						<TreeFile
							name={doc.name}
							type="document"
							docType={doc.mimeType}
							id={doc._id}
							href="/documents/{doc._id}"
						/>
					{/each}

					{#each rootData.generations as gen}
						<TreeFile
							name={gen.name}
							type="generation"
							genType={gen.type}
							id={gen._id}
							href="/generations/{gen._id}"
						/>
					{/each}
				{/if}
			</div>
		{/snippet}
	</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item onclick={onCreateFolder}>New Folder</ContextMenu.Item>
		<ContextMenu.Item onclick={handleContextMenuUpload}>Upload File</ContextMenu.Item>
		<ContextMenu.Separator />
		<ContextMenu.Sub>
			<ContextMenu.SubTrigger>Sort by</ContextMenu.SubTrigger>
			<ContextMenu.SubContent>
				<ContextMenu.RadioGroup bind:value={sortBy}>
					<ContextMenu.RadioItem value="name">Name</ContextMenu.RadioItem>
					<ContextMenu.RadioItem value="date">Date</ContextMenu.RadioItem>
				</ContextMenu.RadioGroup>
			</ContextMenu.SubContent>
		</ContextMenu.Sub>
	</ContextMenu.Content>
</ContextMenu.Root>
