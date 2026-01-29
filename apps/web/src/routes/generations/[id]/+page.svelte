<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '@lucid/backend/convex/_generated/api';
	import { Button } from '@lucid/ui/shadcn/button';
	import { Card, CardContent, CardHeader, CardTitle } from '@lucid/ui/shadcn/card';
	import { Badge } from '@lucid/ui/shadcn/badge';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lucid/ui/shadcn/tabs';
	import { 
		Brain, BookOpen, FileEdit, Sparkles, ArrowLeft, 
		Loader2, RefreshCw, FileText
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	const client = useConvexClient();
	const generationId = $derived($page.params.id);
	
	const generation = useQuery(api.functions.generations.get, () => ({ id: generationId }));
	const flashcardItems = useQuery(api.functions.flashcardItems.listByGeneration, () => ({ generationId }));
	const quizItems = useQuery(api.functions.quizItems.listByGeneration, () => ({ generationId }));
	const summaryContent = useQuery(api.functions.summaryItems.getByGeneration, () => ({ generationId }));

	async function handleRetry() {
		if (generation.data?.type === 'flashcards') {
			await client.mutation(api.workflows.generateFlashcards.retryGeneration, { generationId });
		}
	}

	const typeIcons = {
		flashcards: Brain,
		quiz: BookOpen,
		notes: FileEdit,
		summary: Sparkles
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
						<CardTitle>Summary</CardTitle>
					</CardHeader>
					<CardContent class="space-y-6">
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
