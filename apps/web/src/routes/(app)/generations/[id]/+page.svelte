<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '@alpha/backend/convex/_generated/api';
	import type { Id } from '@alpha/backend/convex/_generated/dataModel';
	import { Button } from '@alpha/ui/shadcn/button';
	import { Card, CardContent, CardHeader, CardTitle } from '@alpha/ui/shadcn/card';
	import { Badge } from '@alpha/ui/shadcn/badge';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '@alpha/ui/shadcn/tabs';
	import SummaryEditor from '@alpha/ui/shadcn/summary-editor';
	import type { EditableSummarySection } from '@alpha/ui/shadcn/summary-editor';
	import { 
		Brain, BookOpen, FileEdit, Sparkles, ArrowLeft, 
		Loader2, RefreshCw, FileText, Pencil, Eye
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	const client = useConvexClient();
	const generationId = $derived($page.params.id);
	const isValidId = $derived(generationId && generationId !== 'new');
	
	const generation = useQuery(api.functions.generations.get, () => 
		isValidId ? { id: generationId as Id<'generations'> } : 'skip'
	);
	const flashcardItems = useQuery(api.functions.flashcardItems.listByGeneration, () => 
		isValidId ? { generationId: generationId as Id<'generations'> } : 'skip'
	);
	const quizItems = useQuery(api.functions.quizItems.listByGeneration, () => 
		isValidId ? { generationId: generationId as Id<'generations'> } : 'skip'
	);
	const summaryContent = useQuery(api.functions.summaryItems.getByGeneration, () => 
		isValidId ? { generationId: generationId as Id<'generations'> } : 'skip'
	);

	let isEditMode = $state(false);
	let isSaving = $state(false);
	let editedSections = $state<EditableSummarySection[]>([]);
	let editedContent = $state('');

	$effect(() => {
		if (summaryContent.data && !isEditMode) {
			editedSections = summaryContent.data.sections.map((s, i) => ({
				id: `section-${i}`,
				title: s.title,
				content: s.content,
				order: i
			}));
			editedContent = summaryContent.data.content;
		}
	});

	async function handleRetry() {
		if (generation.data?.type === 'flashcards' && generationId) {
			await client.action(api.workflows.generateFlashcards.retryGeneration, { generationId: generationId as Id<'generations'> });
		}
	}

	function toggleEditMode() {
		if (isEditMode) {
			isEditMode = false;
		} else {
			if (summaryContent.data) {
				editedSections = summaryContent.data.sections.map((s, i) => ({
					id: `section-${i}`,
					title: s.title,
					content: s.content,
					order: i
				}));
				editedContent = summaryContent.data.content;
			}
			isEditMode = true;
		}
	}

	function handleCreateSection(section: { title: string; content: string }) {
		const newId = `section-${Date.now()}`;
		const maxOrder = editedSections.length > 0 
			? Math.max(...editedSections.map(s => s.order)) 
			: -1;
		editedSections = [...editedSections, {
			id: newId,
			title: section.title,
			content: section.content,
			order: maxOrder + 1
		}];
	}

	function handleUpdateSection(id: string, section: { title: string; content: string }) {
		editedSections = editedSections.map(s => 
			s.id === id ? { ...s, title: section.title, content: section.content } : s
		);
	}

	function handleDeleteSection(id: string) {
		editedSections = editedSections.filter(s => s.id !== id);
	}

	function handleReorderSections(orderedIds: string[]) {
		const sectionMap = new Map(editedSections.map(s => [s.id, s]));
		editedSections = orderedIds.map((id, index) => ({
			...sectionMap.get(id)!,
			order: index
		}));
	}

	async function handleSaveSummary() {
		if (!summaryContent.data?._id) return;
		
		isSaving = true;
		try {
			await client.mutation(api.functions.summaryItems.update, {
				id: summaryContent.data._id,
				content: editedContent,
				sections: editedSections.map(s => ({
					title: s.title,
					content: s.content
				}))
			});
			isEditMode = false;
		} finally {
			isSaving = false;
		}
	}

	function handleCancelEdit() {
		isEditMode = false;
		if (summaryContent.data) {
			editedSections = summaryContent.data.sections.map((s, i) => ({
				id: `section-${i}`,
				title: s.title,
				content: s.content,
				order: i
			}));
			editedContent = summaryContent.data.content;
		}
	}

	const typeIcons = {
		flashcards: Brain,
		quiz: BookOpen,
		notes: FileEdit,
		summary: Sparkles,
		study_guide: BookOpen,
		concept_map: Brain
	};

	function getStatusColor(status: string) {
		switch (status) {
			case 'ready': return 'bg-green-500';
			case 'failed': return 'bg-red-500';
			case 'generating': return 'bg-blue-500';
			default: return 'bg-gray-500';
		}
	}
</script>

<div class="container mx-auto p-6">
	<Button variant="ghost" class="mb-4" href="/generations">
		<ArrowLeft class="size-4 mr-2" />
		Back to Generations
	</Button>

	{#if generation.isLoading}
		<div class="flex items-center justify-center py-12">
			<Loader2 class="size-8 animate-spin text-muted-foreground" />
		</div>
	{:else if generation.data}
		{@const Icon = typeIcons[generation.data.type] || Sparkles}
		
		<div class="mb-8">
			<div class="flex items-center gap-3 mb-2">
				<div class="p-2 rounded-lg {getStatusColor(generation.data.status)} text-white">
					<Icon class="size-6" />
				</div>
				<div>
					<h1 class="text-3xl font-bold">{generation.data.name}</h1>
					<div class="flex items-center gap-2 mt-1">
						<Badge class="capitalize">{generation.data.type}</Badge>
						<Badge variant="outline" class="capitalize">{generation.data.status}</Badge>
					</div>
				</div>
			</div>
			
			{#if generation.data.status === 'failed'}
				<div class="mt-4 p-4 border border-red-200 bg-red-50 rounded-lg">
					<p class="text-red-700">Generation failed: {generation.data.error || 'Unknown error'}</p>
					<Button class="mt-2" onclick={handleRetry}>
						<RefreshCw class="size-4 mr-2" />
						Retry
					</Button>
				</div>
			{:else if generation.data.status === 'generating'}
				<div class="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
					<div class="flex items-center gap-2">
						<Loader2 class="size-4 animate-spin" />
						<p>Generating your {generation.data.type}... This may take a minute.</p>
					</div>
				</div>
			{/if}
		</div>

		{#if generation.data.status === 'ready'}
			{#if generation.data.type === 'flashcards' && flashcardItems.data}
				<Card>
					<CardHeader>
						<CardTitle>Flashcards ({flashcardItems.data.length})</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="grid gap-4">
							{#each flashcardItems.data as item, i}
								<Card>
									<CardContent class="p-4">
										<div class="flex items-start gap-4">
											<span class="text-sm text-muted-foreground">#{i + 1}</span>
											<div class="flex-1">
												<p class="font-medium mb-2">{item.question}</p>
												<p class="text-muted-foreground">{item.answer}</p>
											</div>
										</div>
									</CardContent>
								</Card>
							{/each}
						</div>
					</CardContent>
				</Card>
			{:else if generation.data.type === 'quiz' && quizItems.data}
				<Card>
					<CardHeader>
						<CardTitle>Quiz ({quizItems.data.length} questions)</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-6">
							{#each quizItems.data as item, i}
								<Card>
									<CardContent class="p-4">
										<p class="font-medium mb-4">{i + 1}. {item.question}</p>
										<div class="space-y-2">
											{#each item.options as option, j}
												<div class="flex items-center gap-2 p-2 rounded {j === item.correctIndex ? 'bg-green-100' : 'bg-muted'}">
													<span class="text-sm">{String.fromCharCode(65 + j)}. {option}</span>
													{#if j === item.correctIndex}
														<Badge class="ml-auto">Correct</Badge>
													{/if}
												</div>
											{/each}
										</div>
										{#if item.explanation}
											<div class="mt-4 p-3 bg-muted rounded-lg">
												<p class="text-sm text-muted-foreground"><strong>Explanation:</strong> {item.explanation}</p>
											</div>
										{/if}
									</CardContent>
								</Card>
							{/each}
						</div>
					</CardContent>
				</Card>
			{:else if generation.data.type === 'summary' && summaryContent.data}
				<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<CardTitle>Summary</CardTitle>
							<Button
								variant="outline"
								size="sm"
								onclick={toggleEditMode}
								disabled={isSaving}
							>
								{#if isEditMode}
									<Eye class="size-4 mr-2" />
									View Mode
								{:else}
									<Pencil class="size-4 mr-2" />
									Edit
								{/if}
							</Button>
						</div>
					</CardHeader>
					<CardContent class="space-y-6">
						{#if isEditMode}
							<div class="mb-4">
								<label for="overview-content" class="text-sm font-medium mb-2 block">Overview</label>
								<textarea
									id="overview-content"
									class="w-full min-h-[120px] p-3 rounded-md border bg-background text-sm resize-y"
									bind:value={editedContent}
									disabled={isSaving}
								></textarea>
							</div>
							<SummaryEditor
								sections={editedSections}
								isSaving={isSaving}
								onCreate={handleCreateSection}
								onUpdate={handleUpdateSection}
								onDelete={handleDeleteSection}
								onReorder={handleReorderSections}
								onSave={handleSaveSummary}
								onCancel={handleCancelEdit}
							/>
						{:else}
							<div class="prose max-w-none">
								<h3 class="text-lg font-semibold">Overview</h3>
								<p class="text-muted-foreground">{summaryContent.data.content}</p>
							</div>
							
							{#if summaryContent.data.sections.length > 0}
								<div class="space-y-4">
									<h3 class="text-lg font-semibold">Sections</h3>
									{#each summaryContent.data.sections as section}
										<Card>
											<CardHeader>
												<CardTitle class="text-base">{section.title}</CardTitle>
											</CardHeader>
											<CardContent>
												<p class="text-muted-foreground">{section.content}</p>
											</CardContent>
										</Card>
									{/each}
								</div>
							{/if}
						{/if}
					</CardContent>
				</Card>
			{:else}
				<div class="text-center py-12 border rounded-lg">
					<p class="text-muted-foreground">Content not available</p>
				</div>
			{/if}
		{/if}
	{:else}
		<div class="text-center py-12">
			<p class="text-muted-foreground">Generation not found</p>
			<Button href="/generations" class="mt-4">Back to Generations</Button>
		</div>
	{/if}
</div>
