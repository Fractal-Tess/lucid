<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '@alpha/backend/convex/_generated/api';
	import type { Id } from '@alpha/backend/convex/_generated/dataModel';
	import { Button } from '@alpha/ui/shadcn/button';
	import { Input } from '@alpha/ui/shadcn/input';
	import { Label } from '@alpha/ui/shadcn/label';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@alpha/ui/shadcn/dialog';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '@alpha/ui/shadcn/select';
	import { Search, Filter } from '@lucide/svelte';
	import { Popover, PopoverContent, PopoverTrigger } from '@alpha/ui/shadcn/popover';
	import { Badge } from '@alpha/ui/shadcn/badge';
	import FileTree from '$lib/components/file-tree/FileTree.svelte';

	const client = useConvexClient();
	const fileSystem = useQuery(api.functions.folders.getFileSystem, {});
	const foldersList = useQuery(api.functions.folders.list, {});
	const currentUser = useQuery(api.functions.users.getCurrentUser, {});

	// Create Folder State

	// Search and Filter State
	let searchQuery = $state('');
	let selectedType = $state<'all' | 'documents' | 'folders' | 'generations'>('all');

	// Create Folder State
	let newFolderName = $state('');
	let newFolderDescription = $state('');
	let isCreatingFolder = $state(false);
	let isCreateDialogOpen = $state(false);

	// Filtered Data
	const filteredData = $derived.by(() => {
		if (!fileSystem.data) return { folders: [], documents: [], generations: [] };

		let { folders, documents, generations } = fileSystem.data;

		// Apply Type Filter
		if (selectedType !== 'all') {
			if (selectedType !== 'folders') folders = [];
			if (selectedType !== 'documents') documents = [];
			if (selectedType !== 'generations') generations = [];
		}

		// Apply Search Filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			const matchingFolders = folders.filter(f => f.name.toLowerCase().includes(query));
			const matchingDocuments = documents.filter(d => d.name.toLowerCase().includes(query));
			const matchingGenerations = generations.filter(g => g.name.toLowerCase().includes(query));

			const includedFolderIds = new Set<string>();

			// Helper to add ancestors
			const folderMap = new Map(folders.map(f => [f._id, f]));
			const addAncestors = (folderId: string | undefined) => {
				let currentId = folderId;
				while (currentId) {
					includedFolderIds.add(currentId);
					const folder = folderMap.get(currentId as Id<'folders'>);
					if (!folder) break;
					currentId = folder.parentId;
				}
			};

			// Add matches and their ancestors
			matchingFolders.forEach(f => {
				includedFolderIds.add(f._id);
				addAncestors(f.parentId);
			});
			matchingDocuments.forEach(d => addAncestors(d.folderId));
			matchingGenerations.forEach(g => addAncestors(g.folderId));

			// Filter final lists
			folders = folders.filter(f => includedFolderIds.has(f._id));
			documents = matchingDocuments;
			generations = matchingGenerations;
		}

		return { folders, documents, generations };
	});

	// Action States
	let renameDialog = $state<{ open: boolean; id: string; type: string; name: string }>({ open: false, id: '', type: '', name: '' });
	let moveDialog = $state<{ open: boolean; id: string; type: string; targetId: string }>({ open: false, id: '', type: '', targetId: '' });
	let deleteDialog = $state<{ open: boolean; id: string; type: string }>({ open: false, id: '', type: '' });
	let isRenaming = $state(false);
	let isMoving = $state(false);
	let isDeleting = $state(false);

	// Create Folder
	async function handleCreateFolder() {
		if (!newFolderName.trim()) return;
		isCreatingFolder = true;
		try {
			await client.mutation(api.functions.folders.create, { 
				name: newFolderName.trim(),
				description: newFolderDescription.trim() || undefined
			});
			newFolderName = '';
			newFolderDescription = '';
			isCreateDialogOpen = false;
		} catch (error) {
			console.error('Failed to create folder:', error);
		} finally {
			isCreatingFolder = false;
		}
	}

	// Rename
	function openRename(id: string, type: 'folder' | 'document' | 'generation', currentName: string) {
		renameDialog = { open: true, id, type, name: currentName };
	}

	async function handleRename() {
		if (!renameDialog.name.trim()) return;
		isRenaming = true;
		try {
			if (renameDialog.type === 'folder') {
				await client.mutation(api.functions.folders.update, { id: renameDialog.id as Id<'folders'>, name: renameDialog.name });
			} else if (renameDialog.type === 'document') {
				await client.mutation(api.functions.documents.update, { id: renameDialog.id as Id<'documents'>, name: renameDialog.name });
			} else if (renameDialog.type === 'generation') {
				await client.mutation(api.functions.generations.update, { id: renameDialog.id as Id<'generations'>, name: renameDialog.name });
			}
			renameDialog.open = false;
		} catch (error) {
			console.error('Failed to rename:', error);
		} finally {
			isRenaming = false;
		}
	}

	// Move
	function openMove(id: string, type: 'folder' | 'document') {
		moveDialog = { open: true, id, type, targetId: '' };
	}

	async function handleMove() {
		isMoving = true;
		try {
			const targetId = moveDialog.targetId === 'root' ? undefined : (moveDialog.targetId as Id<'folders'>);
			if (moveDialog.type === 'folder') {
				await client.mutation(api.functions.folders.move, { 
					id: moveDialog.id as Id<'folders'>, 
					newParentId: targetId 
				});
			} else if (moveDialog.type === 'document') {
				await client.mutation(api.functions.documents.moveToFolder, { 
					id: moveDialog.id as Id<'documents'>, 
					folderId: targetId 
				});
			}
			moveDialog.open = false;
		} catch (error) {
			console.error('Failed to move:', error);
		} finally {
			isMoving = false;
		}
	}

	// Delete
	function openDelete(id: string, type: 'folder' | 'document' | 'generation') {
		deleteDialog = { open: true, id, type };
	}

	async function handleDelete() {
		isDeleting = true;
		try {
			if (deleteDialog.type === 'folder') {
				await client.mutation(api.functions.folders.remove, { id: deleteDialog.id as Id<'folders'> });
			} else if (deleteDialog.type === 'document') {
				await client.mutation(api.functions.documents.remove, { id: deleteDialog.id as Id<'documents'> });
			} else if (deleteDialog.type === 'generation') {
				await client.mutation(api.functions.generations.remove, { id: deleteDialog.id as Id<'generations'> });
			}
			deleteDialog.open = false;
		} catch (error) {
			console.error('Failed to delete:', error);
		} finally {
			isDeleting = false;
		}
	}

	// Download
	async function handleDownload(id: string, name: string) {
		try {
			const url = await client.query(api.functions.documents.getDownloadUrl, { documentId: id as Id<'documents'> });
			if (url) {
				const a = document.createElement('a');
				a.href = url;
				a.download = name;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			}
		} catch (error) {
			console.error('Failed to download:', error);
		}
	}

	// Upload
	async function handleUpload(file: File, folderId?: string) {
		if (!currentUser.data) return;
		
		try {
			const uploadUrl = await client.mutation(api.functions.documents.generateUploadUrl, {});
			
			const result = await fetch(uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': file.type },
				body: file,
			});

			if (!result.ok) throw new Error('Upload failed');

			const { storageId } = await result.json();

			await client.mutation(api.functions.documents.create, {
				userId: currentUser.data._id,
				folderId: folderId as Id<'folders'> | undefined,
				name: file.name,
				storageId,
				mimeType: file.type,
				size: file.size
			});
		} catch (error) {
			console.error('Failed to upload:', error);
		}
	}
</script>

<div class="h-[calc(100vh-4rem)] p-6 w-full flex flex-col">
	<div class="flex flex-col gap-4 mb-4 shrink-0">
		<div class="flex items-center gap-2">
			<div class="relative flex-1">
				<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search files..."
					class="pl-9 w-full bg-background"
					bind:value={searchQuery}
				/>
			</div>
			
			<Popover>
				<PopoverTrigger>
					{#snippet child({ props })}
						<Button variant="outline" size="icon" class="shrink-0" {...props}>
							<Filter class="h-4 w-4" />
						</Button>
					{/snippet}
				</PopoverTrigger>
				<PopoverContent class="w-48" align="end">
					<div class="grid gap-4">
						<div class="space-y-2">
							<h4 class="font-medium leading-none">Filter by Type</h4>
							<div class="grid gap-2">
								<Button 
									variant={selectedType === 'all' ? 'secondary' : 'ghost'} 
									class="justify-start h-8 px-2"
									onclick={() => selectedType = 'all'}
								>
									All Files
								</Button>
								<Button 
									variant={selectedType === 'folders' ? 'secondary' : 'ghost'} 
									class="justify-start h-8 px-2"
									onclick={() => selectedType = 'folders'}
								>
									Folders
								</Button>
								<Button 
									variant={selectedType === 'documents' ? 'secondary' : 'ghost'} 
									class="justify-start h-8 px-2"
									onclick={() => selectedType = 'documents'}
								>
									Documents
								</Button>
								<Button 
									variant={selectedType === 'generations' ? 'secondary' : 'ghost'} 
									class="justify-start h-8 px-2"
									onclick={() => selectedType = 'generations'}
								>
									Generations
								</Button>
							</div>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>

		{#if selectedType !== 'all'}
			<div class="flex gap-2">
				<Badge variant="secondary" class="gap-1">
					{selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
					<button 
						class="ml-1 hover:text-destructive focus:outline-none" 
						onclick={() => selectedType = 'all'}
					>
						×
					</button>
				</Badge>
			</div>
		{/if}
	</div>

	<div class="bg-background border rounded-lg p-4 flex-1 overflow-auto">
		{#if fileSystem.isLoading}
			<div class="flex items-center justify-center h-full">
				<p class="text-muted-foreground">Loading file system...</p>
			</div>
		{:else if fileSystem.data}
			<FileTree 
				folders={filteredData.folders}
				documents={filteredData.documents}
				generations={filteredData.generations}
				onRename={openRename}
				onDelete={openDelete}
				onMove={openMove}
				onDownload={handleDownload}
				onUpload={handleUpload}
				onCreateFolder={() => isCreateDialogOpen = true}
			/>
		{:else}
			<div class="flex flex-col items-center justify-center h-full text-center">
				<p class="text-muted-foreground mb-4">No files found.</p>
				<Button variant="outline" onclick={() => isCreateDialogOpen = true}>
					Create your first folder
				</Button>
			</div>
		{/if}
	</div>
</div>

<Dialog bind:open={renameDialog.open}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Rename</DialogTitle>
		</DialogHeader>
		<div class="space-y-4 pt-4">
			<div class="space-y-2">
				<Label for="rename-input">Name</Label>
				<Input id="rename-input" bind:value={renameDialog.name} />
			</div>
			<DialogFooter>
				<Button variant="outline" onclick={() => renameDialog.open = false}>Cancel</Button>
				<Button onclick={handleRename} disabled={isRenaming}>
					{isRenaming ? 'Renaming...' : 'Save'}
				</Button>
			</DialogFooter>
		</div>
	</DialogContent>
</Dialog>

<Dialog bind:open={moveDialog.open}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Move to...</DialogTitle>
		</DialogHeader>
		<div class="space-y-4 pt-4">
			<div class="space-y-2">
				<Label>Select Destination</Label>
				<Select type="single" bind:value={moveDialog.targetId}>
					<SelectTrigger>
						{#if moveDialog.targetId}
							{foldersList.data?.find(f => f._id === moveDialog.targetId)?.name ?? (moveDialog.targetId === 'root' ? 'My Files (Root)' : 'Select folder')}
						{:else}
							<span class="text-muted-foreground">Select folder</span>
						{/if}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="root">My Files (Root)</SelectItem>
						{#if foldersList.data}
							{#each foldersList.data as folder}
								{#if folder._id !== moveDialog.id}
									<SelectItem value={folder._id}>{folder.name}</SelectItem>
								{/if}
							{/each}
						{/if}
					</SelectContent>
				</Select>
			</div>
			<DialogFooter>
				<Button variant="outline" onclick={() => moveDialog.open = false}>Cancel</Button>
				<Button onclick={handleMove} disabled={isMoving || !moveDialog.targetId}>
					{isMoving ? 'Moving...' : 'Move'}
				</Button>
			</DialogFooter>
		</div>
	</DialogContent>
</Dialog>

<Dialog bind:open={deleteDialog.open}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete Item</DialogTitle>
		</DialogHeader>
		<div class="py-4">
			<p>Are you sure you want to delete this item? This action cannot be undone.</p>
			{#if deleteDialog.type === 'folder'}
				<p class="text-sm text-red-500 mt-2">Warning: All contents inside this folder will also be deleted.</p>
			{/if}
		</div>
		<DialogFooter>
			<Button variant="outline" onclick={() => deleteDialog.open = false}>Cancel</Button>
			<Button variant="destructive" onclick={handleDelete} disabled={isDeleting}>
				{isDeleting ? 'Deleting...' : 'Delete'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
