<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '@alpha/backend/convex/_generated/api';
	import type { Id } from '@alpha/backend/convex/_generated/dataModel';
	import { Button } from '@alpha/ui/shadcn/button';
	import { Plus, Brain, BookOpen, FileEdit, Sparkles, BrainCircuit, FileType } from '@lucide/svelte';
	import GenerationCard from '$lib/components/generations/GenerationCard.svelte';

	const client = useConvexClient();
	const generations = useQuery(api.functions.generations.list);

	async function handleDelete(id: string) {
		if (confirm('Are you sure you want to delete this generation?')) {
			await client.mutation(api.functions.generations.remove, { id: id as Id<'generations'> });
		}
	}

	let filterType = $state<string | 'all'>('all');

	const filteredGenerations = $derived(() => {
		if (!generations.data) return [];
		if (filterType === 'all') return generations.data;
		return generations.data.filter((g) => g.type === filterType);
	});

    const filters = [
        { id: 'all', label: 'All', icon: null },
        { id: 'flashcards', label: 'Flashcards', icon: FileType },
        { id: 'quiz', label: 'Quiz', icon: BrainCircuit },
        { id: 'notes', label: 'Notes', icon: FileEdit },
        { id: 'summary', label: 'Summary', icon: Sparkles },
        { id: 'study_guide', label: 'Study Guide', icon: BookOpen },
        { id: 'concept_map', label: 'Concept Map', icon: Brain }
    ];
</script>

<div class="container mx-auto p-6 space-y-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Generations</h1>
			<p class="text-muted-foreground mt-1">Your AI-generated study materials</p>
		</div>
		<Button href="/folders">
			<Plus class="size-4 mr-2" />
			New Generation
		</Button>
	</div>

	<div class="flex flex-wrap gap-2">
        {#each filters as filter}
            <Button 
                variant={filterType === filter.id ? 'default' : 'outline'} 
                size="sm"
                onclick={() => filterType = filter.id}
                class="gap-2"
            >
                {#if filter.icon}
                    <filter.icon class="size-4" />
                {/if}
                {filter.label}
            </Button>
        {/each}
	</div>

	{#if generations.isLoading}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each Array(6) as _}
                <div class="h-[200px] rounded-xl border bg-muted/10 animate-pulse"></div>
            {/each}
		</div>
	{:else if filteredGenerations().length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredGenerations() as generation (generation._id)}
				<GenerationCard {generation} onDelete={handleDelete} />
			{/each}
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-muted/5 text-center">
            <div class="p-4 rounded-full bg-muted mb-4">
                <Sparkles class="size-8 text-muted-foreground" />
            </div>
			<h3 class="text-lg font-semibold mb-2">No generations found</h3>
			<p class="text-muted-foreground mb-6 max-w-sm">
                {filterType === 'all' 
                    ? "You haven't created any study materials yet. Upload a document to get started." 
                    : `No ${filterType} found. Try selecting a different filter or create a new one.`}
            </p>
            <Button href="/folders">
                <Plus class="size-4 mr-2" />
                Create Generation
            </Button>
		</div>
	{/if}
</div>
