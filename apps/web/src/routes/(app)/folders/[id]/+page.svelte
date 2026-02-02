<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '@alpha/backend/convex/_generated/api';
	import type { Id } from '@alpha/backend/convex/_generated/dataModel';
	import { Button } from '@alpha/ui/shadcn/button';
	import { Card, CardContent, CardHeader, CardTitle } from '@alpha/ui/shadcn/card';
	import { Input } from '@alpha/ui/shadcn/input';
	import { Label } from '@alpha/ui/shadcn/label';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@alpha/ui/shadcn/dialog';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '@alpha/ui/shadcn/tabs';
	import { 
		FileText, Upload, Plus, ChevronRight, 
		Brain, Sparkles, FileEdit, BookOpen,
		ArrowLeft
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	const client = useConvexClient();
	const currentUser = useQuery(api.functions.users.getCurrentUser, {});
	const folderId = $derived($page.params.id);
	
	const folder = useQuery(api.functions.folders.get, () =>
		folderId ? { id: folderId as Id<'folders'> } : 'skip'
	);
	const folderWithPath = useQuery(api.functions.folders.getWithPath, () =>
		folderId ? { id: folderId as Id<'folders'> } : 'skip'
	);
	const subfolders = useQuery(api.functions.folders.listByParent, () =>
		folderId ? { parentId: folderId as Id<'folders'> } : 'skip'
	);
	const documents = useQuery(api.functions.documents.listByFolder, () =>
		folderId ? { folderId: folderId as Id<'folders'> } : 'skip'
	);
	const generations = useQuery(api.functions.generations.listByFolder, () =>
		folderId ? { folderId: folderId as Id<'folders'> } : 'skip'
	);

	let newSubfolderName = $state('');
	let isCreatingSubfolder = $state(false);
	let selectedDocsForGeneration = $state<string[]>([]);
	let newGenerationName = $state('');
	const GENERATION_TYPES = ['flashcards', 'quiz', 'notes', 'summary'] as const;
	let newGenerationType = $state<typeof GENERATION_TYPES[number]>('flashcards');
	let isCreatingGeneration = $state(false);

	async function handleCreateSubfolder() {
		if (!newSubfolderName.trim() || !folderId) return;
		isCreatingSubfolder = true;
		try {
			await client.mutation(api.functions.folders.create, { 
				name: newSubfolderName.trim(),
				parentId: folderId as Id<'folders'>
			});
			newSubfolderName = '';
		} catch (error) {
			console.error('Failed to create subfolder:', error);
		} finally {
			isCreatingSubfolder = false;
		}
	}

	async function handleCreateGeneration() {
		if (!newGenerationName.trim() || selectedDocsForGeneration.length === 0 || !folderId) return;
		isCreatingGeneration = true;
		try {
			await client.mutation(api.functions.generations.create, {
				folderId: folderId as Id<'folders'>,
				name: newGenerationName.trim(),
				type: newGenerationType,
				sourceDocumentIds: selectedDocsForGeneration as Id<'documents'>[]
			});
			newGenerationName = '';
			selectedDocsForGeneration = [];
		} catch (error) {
			console.error('Failed to create generation:', error);
		} finally {
			isCreatingGeneration = false;
		}
	}

	function toggleDocSelection(docId: string) {
		if (selectedDocsForGeneration.includes(docId)) {
			selectedDocsForGeneration = selectedDocsForGeneration.filter(id => id !== docId);
		} else {
			selectedDocsForGeneration = [...selectedDocsForGeneration, docId];
		}
	}

	function getGenerationIcon(type: string) {
		switch (type) {
			case 'flashcards': return Brain;
			case 'quiz': return BookOpen;
			case 'notes': return FileEdit;
			case 'summary': return Sparkles;
			default: return Sparkles;
		}
	}
</script>

<div class="container mx-auto p-6">
	<Button variant="ghost" class="mb-4" href="/folders">
		<ArrowLeft class="size-4 mr-2" />
		Back to Files
	</Button>

	{#if folder.isLoading}
		<div class="flex items-center justify-center py-12">
			<p class="text-muted-foreground">Loading...</p>
		</div>
	{:else if folder.data}
		<div class="mb-8">
			{#if folderWithPath.data && folderWithPath.data.path.length > 1}
				<div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
					{#each folderWithPath.data.path.slice(0, -1) as pathItem, i}
						<a href="/folders/{pathItem.id}" class="hover:text-foreground">{pathItem.name}</a>
						{#if i < folderWithPath.data.path.length - 2}
							<span>/</span>
						{/if}
					{/each}
				</div>
			{/if}
			<div class="flex items-center gap-3 mb-2">
				<FileText class="size-8 text-muted-foreground" />
				<h1 class="text-3xl font-bold">{folder.data.name}</h1>
			</div>
			{#if folder.data.description}
				<p class="text-muted-foreground">{folder.data.description}</p>
			{/if}
		</div>

		<Tabs value="contents" class="w-full">
			<TabsList class="mb-6">
				<TabsTrigger value="contents">Contents</TabsTrigger>
				<TabsTrigger value="generations">Generations</TabsTrigger>
			</TabsList>

			<TabsContent value="contents" class="space-y-6">
				<div class="flex gap-2">
					<Button href="/documents/upload?folder={folderId}">
						<Upload class="size-4 mr-2" />
						Upload Document
					</Button>
					<Dialog>
						<DialogTrigger>
							<Button variant="outline">
								<FileText class="size-4 mr-2" />
								New Subfolder
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create Subfolder</DialogTitle>
							</DialogHeader>
							<div class="space-y-4 pt-4">
								<div class="space-y-2">
									<Label for="subfolder-name">Folder Name</Label>
									<Input id="subfolder-name" placeholder="e.g., Lecture Notes" bind:value={newSubfolderName} />
								</div>
								<Button onclick={handleCreateSubfolder} disabled={isCreatingSubfolder || !newSubfolderName.trim()} class="w-full">
									{isCreatingSubfolder ? 'Creating...' : 'Create Subfolder'}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>

				{#if subfolders.data && subfolders.data.length > 0}
					<Card>
						<CardHeader>
							<CardTitle>Subfolders</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="grid gap-2">
								{#each subfolders.data as subfolder}
									<Button 
										variant="ghost" 
										class="justify-between h-auto py-3 px-4"
										href="/folders/{subfolder._id}"
									>
										<div class="flex items-center gap-3">
											<FileText class="size-5 text-muted-foreground" />
											<span>{subfolder.name}</span>
										</div>
										<ChevronRight class="size-4 text-muted-foreground" />
									</Button>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}

				{#if documents.data && documents.data.length > 0}
					<Card>
						<CardHeader>
							<CardTitle>Documents</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="grid gap-2">
								{#each documents.data as doc}
									<div class="flex items-center justify-between p-3 rounded-lg border">
										<div class="flex items-center gap-3">
											<FileText class="size-5 text-muted-foreground" />
											<div>
												<p class="font-medium">{doc.name}</p>
												<p class="text-xs text-muted-foreground">{doc.status} • {(doc.size / 1024 / 1024).toFixed(2)} MB</p>
											</div>
										</div>
										<input
											type="checkbox"
											checked={selectedDocsForGeneration.includes(doc._id)}
											onchange={() => toggleDocSelection(doc._id)}
											class="size-4"
										/>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{:else}
					<div class="text-center py-12 border rounded-lg">
						<p class="text-muted-foreground mb-4">No documents yet</p>
						<Button href="/documents/upload?folder={folderId}">
							<Upload class="size-4 mr-2" />
							Upload Your First Document
						</Button>
					</div>
				{/if}
			</TabsContent>

			<TabsContent value="generations" class="space-y-6">
				<Dialog>
					<DialogTrigger>
						<Button>
							<Plus class="size-4 mr-2" />
							New Generation
						</Button>
					</DialogTrigger>
					<DialogContent class="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Create AI Generation</DialogTitle>
						</DialogHeader>
						<div class="space-y-4 pt-4">
							<div class="space-y-2">
								<Label>Generation Type</Label>
								<div class="grid grid-cols-4 gap-2">
									{#each GENERATION_TYPES as type}
										<Button
											variant={newGenerationType === type ? 'default' : 'outline'}
											size="sm"
											onclick={() => newGenerationType = type}
											class="capitalize"
										>
											{type}
										</Button>
									{/each}
								</div>
							</div>
							<div class="space-y-2">
								<Label for="gen-name">Name</Label>
								<Input id="gen-name" placeholder="e.g., Chapter 1 Flashcards" bind:value={newGenerationName} />
							</div>
							<div class="space-y-2">
								<Label>Select Source Documents</Label>
								{#if documents.data && documents.data.length > 0}
									<div class="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
										{#each documents.data as doc}
											<label class="flex items-center gap-2 cursor-pointer">
												<input
													type="checkbox"
													checked={selectedDocsForGeneration.includes(doc._id)}
													onchange={() => toggleDocSelection(doc._id)}
													class="size-4"
												/>
												<span class="text-sm">{doc.name}</span>
											</label>
										{/each}
									</div>
								{:else}
									<p class="text-sm text-muted-foreground">No documents available. Upload documents first.</p>
								{/if}
							</div>
							<Button 
								onclick={handleCreateGeneration} 
								disabled={isCreatingGeneration || !newGenerationName.trim() || selectedDocsForGeneration.length === 0} 
								class="w-full"
							>
								{isCreatingGeneration ? 'Creating...' : 'Create Generation'}
							</Button>
						</div>
					</DialogContent>
				</Dialog>

				{#if generations.data && generations.data.length > 0}
					<div class="grid gap-4">
						{#each generations.data as generation}
							{@const Icon = getGenerationIcon(generation.type)}
							<Card>
								<CardContent class="p-4">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-3">
											<div class="p-2 rounded-lg bg-muted">
												<Icon class="size-5" />
											</div>
											<div>
												<p class="font-medium">{generation.name}</p>
												<p class="text-xs text-muted-foreground capitalize">{generation.type} • {generation.status}</p>
											</div>
										</div>
										<Button variant="ghost" size="sm" href="/generations/{generation._id}">View</Button>
									</div>
								</CardContent>
							</Card>
						{/each}
					</div>
				{:else}
					<div class="text-center py-12 border rounded-lg">
						<p class="text-muted-foreground">No generations yet. Create your first AI-generated study material.</p>
					</div>
				{/if}
			</TabsContent>
		</Tabs>
	{:else}
		<div class="text-center py-12">
			<p class="text-muted-foreground">Folder not found</p>
			<Button href="/folders" class="mt-4">Back to Files</Button>
		</div>
	{/if}
</div>
