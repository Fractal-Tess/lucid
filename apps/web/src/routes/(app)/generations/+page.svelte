<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '@alpha/backend/convex/_generated/api';
	import type { Id } from '@alpha/backend/convex/_generated/dataModel';
	import { Button } from '@alpha/ui/shadcn/button';
	import { Card, CardContent, CardHeader, CardTitle } from '@alpha/ui/shadcn/card';
	import { Input } from '@alpha/ui/shadcn/input';
	import { Badge } from '@alpha/ui/shadcn/badge';
	import { 
		Brain, BookOpen, FileEdit, Sparkles, Plus, 
		Trash2, Loader2, CheckCircle, XCircle, Clock
	} from '@lucide/svelte';

	const client = useConvexClient();
	const generations = useQuery(api.functions.generations.list);

	async function handleDelete(id: string) {
		if (confirm('Are you sure you want to delete this generation?')) {
			await client.mutation(api.functions.generations.remove, { id: id as Id<'generations'> });
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

	const typeColors = {
		flashcards: 'bg-blue-500',
		quiz: 'bg-green-500',
		notes: 'bg-yellow-500',
		summary: 'bg-purple-500',
		study_guide: 'bg-orange-500',
		concept_map: 'bg-pink-500'
	};

	function getStatusIcon(status: string) {
		switch (status) {
			case 'ready': return CheckCircle;
			case 'failed': return XCircle;
			case 'generating': return Loader2;
			default: return Clock;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'ready': return 'text-green-500';
			case 'failed': return 'text-red-500';
			case 'generating': return 'text-blue-500';
			default: return 'text-gray-500';
		}
	}

	let filterType = $state<string | 'all'>('all');

	const filteredGenerations = $derived(() => {
		if (!generations.data) return [];
		if (filterType === 'all') return generations.data;
		return generations.data.filter((g) => g.type === filterType);
	});
</script>

<div class="container mx-auto p-6">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold">Generations</h1>
			<p class="text-muted-foreground mt-1">Your AI-generated study materials</p>
		</div>
		<Button href="/subjects">
			<Plus class="size-4 mr-2" />
			New Generation
		</Button>
	</div>

	<div class="flex gap-2 mb-6">
		<Button 
			variant={filterType === 'all' ? 'default' : 'outline'} 
			size="sm"
			onclick={() => filterType = 'all'}
		>
			All
		</Button>
		{#each Object.keys(typeIcons) as type}
			<Button 
				variant={filterType === type ? 'default' : 'outline'} 
				size="sm"
				onclick={() => filterType = type}
				class="capitalize"
			>
				{type}
			</Button>
		{/each}
	</div>

	{#if generations.isLoading}
		<div class="flex items-center justify-center py-12">
			<p class="text-muted-foreground">Loading...</p>
		</div>
	{:else if filteredGenerations().length > 0}
		<div class="grid gap-4">
			{#each filteredGenerations() as generation}
				{@const Icon = typeIcons[generation.type] || Sparkles}
				{@const StatusIcon = getStatusIcon(generation.status)}
				<Card>
					<CardContent class="p-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-4">
								<div class="p-3 rounded-lg {typeColors[generation.type] || 'bg-gray-500'} text-white">
									<Icon class="size-5" />
								</div>
								<div>
									<p class="font-medium">{generation.name}</p>
									<div class="flex items-center gap-2 mt-1">
										<Badge variant="secondary" class="capitalize">{generation.type}</Badge>
										<div class="flex items-center gap-1 text-xs">
											<StatusIcon class="size-3 {getStatusColor(generation.status)} {generation.status === 'generating' ? 'animate-spin' : ''}" />
											<span class="capitalize">{generation.status}</span>
										</div>
									</div>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<Button 
									variant="ghost" 
									size="sm" 
									href="/generations/{generation._id}"
									disabled={generation.status !== 'ready'}
								>
									View
								</Button>
								<Button 
									variant="ghost" 
									size="icon" 
									class="text-destructive"
									onclick={() => handleDelete(generation._id)}
								>
									<Trash2 class="size-4" />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else}
		<div class="text-center py-12 border rounded-lg">
			<p class="text-muted-foreground mb-4">No generations yet</p>
			<Button href="/subjects">
				<Plus class="size-4 mr-2" />
				Create Your First Generation
			</Button>
		</div>
	{/if}
</div>
