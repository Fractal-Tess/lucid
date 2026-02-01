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
		Folder, FileText, Upload, Plus, ChevronRight, 
		MoreHorizontal, Brain, Sparkles, FileEdit, BookOpen,
		ArrowLeft
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	const client = useConvexClient();
	const currentUser = useQuery(api.functions.users.getCurrentUser);
	const subjectId = $derived($page.params.id);
	
	const subject = useQuery(api.functions.subjects.get, () =>
		subjectId ? { id: subjectId as Id<'subjects'> } : 'skip'
	);
	const folders = useQuery(api.functions.folders.listBySubject, () =>
		subjectId ? { subjectId: subjectId as Id<'subjects'> } : 'skip'
	);
	const documents = useQuery(api.functions.documents.listBySubject, () =>
		subjectId ? { subjectId: subjectId as Id<'subjects'> } : 'skip'
	);
	const generations = useQuery(api.functions.generations.listBySubject, () =>
		subjectId ? { subjectId: subjectId as Id<'subjects'> } : 'skip'
	);

	let newFolderName = $state('');
	let isCreatingFolder = $state(false);
	let selectedDocsForGeneration = $state<string[]>([]);
	let newGenerationName = $state('');
	const GENERATION_TYPES = ['flashcards', 'quiz', 'notes', 'summary'] as const;
	let newGenerationType = $state<typeof GENERATION_TYPES[number]>('flashcards');
	let isCreatingGeneration = $state(false);

	async function handleCreateFolder() {
		if (!newFolderName.trim() || !subjectId || !currentUser.data?._id) return;
		isCreatingFolder = true;
		await client.mutation(api.functions.folders.create, { 
			name: newFolderName.trim(),
			userId: currentUser.data._id,
			subjectId: subjectId as Id<'subjects'>
		});
		newFolderName = '';
		isCreatingFolder = false;
	}

	async function handleCreateGeneration() {
		if (!newGenerationName.trim() || selectedDocsForGeneration.length === 0 || !subjectId || !currentUser.data?._id) return;
		isCreatingGeneration = true;
		await client.mutation(api.functions.generations.create, {
			userId: currentUser.data._id,
			subjectId: subjectId as Id<'subjects'>,
			name: newGenerationName.trim(),
			type: newGenerationType,
			sourceDocumentIds: selectedDocsForGeneration as Id<'documents'>[]
		});
		newGenerationName = '';
		selectedDocsForGeneration = [];
		isCreatingGeneration = false;
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
	<Button variant="ghost" class="mb-4" href="/subjects">
		<ArrowLeft class="size-4 mr-2" />
		Back to Subjects
	</Button>

	{#if subject.isLoading}
		<div class="flex items-center justify-center py-12">
			<p class="text-muted-foreground">Loading...</p>
		</div>
	{:else if subject.data}
		<div class="mb-8">
			<div class="flex items-center gap-3 mb-2">
				<span class="text-4xl">{subject.data.icon || ''}</span>
				<h1 class="text-3xl font-bold">{subject.data.name}</h1>
			</div>
			{#if subject.data.description}
				<p class="text-muted-foreground">{subject.data.description}</p>
			{/if}
		</div>

		<Tabs value="documents" class="w-full">
			<TabsList class="mb-6">
				<TabsTrigger value="documents">Documents</TabsTrigger>
				<TabsTrigger value="generations">Generations</TabsTrigger>
			</TabsList>

			<TabsContent value="documents" class="space-y-6">
				<div class="flex gap-2">
					<Button href="/documents/upload?subject={subjectId}">
						<Upload class="size-4 mr-2" />
						Upload Document
					</Button>
					<Dialog>
						<DialogTrigger>
							<Button variant="outline">
								<Folder class="size-4 mr-2" />
								New Folder
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create Folder</DialogTitle>
							</DialogHeader>
							<div class="space-y-4 pt-4">
								<div class="space-y-2">
									<Label for="folder-name">Folder Name</Label>
									<Input id="folder-name" placeholder="e.g., Lecture Notes" bind:value={newFolderName} />
								</div>
								<Button onclick={handleCreateFolder} disabled={isCreatingFolder || !newFolderName.trim()} class="w-full">
									{isCreatingFolder ? 'Creating...' : 'Create Folder'}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>

				{#if folders.data && folders.data.length > 0}
					<Card>
						<CardHeader>
							<CardTitle>Folders</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="grid gap-2">
								{#each folders.data as folder}
									<Button 
										variant="ghost" 
										class="justify-between h-auto py-3 px-4"
										href="/folders/{folder._id}"
									>
										<div class="flex items-center gap-3">
											<Folder class="size-5 text-muted-foreground" />
											<span>{folder.name}</span>
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
								{#each documents.data.filter((d) => !d.folderId) as doc}
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
						<Button href="/documents/upload?subject={subjectId}">
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
			<p class="text-muted-foreground">Subject not found</p>
			<Button href="/subjects" class="mt-4">Back to Subjects</Button>
		</div>
	{/if}
</div>
