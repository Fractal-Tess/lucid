<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '@alpha/backend/convex/_generated/api';
	import { Button } from '@alpha/ui/shadcn/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@alpha/ui/shadcn/card';
	import { BookOpen, FileText, Brain, Sparkles, Plus } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	// Query recent data
	const recentGenerations = useQuery(api.functions.generations.list);
	
	const quickActions = [
		{ label: 'New Subject', icon: BookOpen, href: '/subjects/new' },
		{ label: 'Upload Document', icon: FileText, href: '/documents/upload' },
		{ label: 'Create Flashcards', icon: Brain, href: '/generations/new?type=flashcards' },
		{ label: 'Generate Summary', icon: Sparkles, href: '/generations/new?type=summary' },
	];
</script>

<div class="container mx-auto p-6">
	<div class="mb-8">
		<h1 class="text-3xl font-bold">Dashboard</h1>
		<p class="text-muted-foreground mt-1">Welcome back! Here's what's happening with your studies.</p>
	</div>

	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
		{#each quickActions as action}
			<Button variant="outline" class="h-auto py-4 flex flex-col items-center gap-2" href={action.href}>
				<action.icon class="size-6" />
				<span class="text-sm">{action.label}</span>
			</Button>
		{/each}
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center justify-between">
					Recent Generations
					<Button variant="ghost" size="sm" href="/generations">View All</Button>
				</CardTitle>
				<CardDescription>Your latest AI-generated study materials</CardDescription>
			</CardHeader>
			<CardContent>
				{#if recentGenerations.isLoading}
					<p class="text-muted-foreground">Loading...</p>
				{:else if recentGenerations.data && recentGenerations.data.length > 0}
					<div class="space-y-3">
						{#each recentGenerations.data.slice(0, 5) as generation}
							<div class="flex items-center justify-between p-3 rounded-lg border">
								<div class="flex items-center gap-3">
									<span class="text-2xl">
										{generation.type === 'flashcards' ? '' : generation.type === 'quiz' ? '' : generation.type === 'notes' ? '' : generation.type === 'summary' ? '' : ''}
									</span>
									<div>
										<p class="font-medium">{generation.name}</p>
										<p class="text-xs text-muted-foreground capitalize">{generation.type} • {generation.status}</p>
									</div>
								</div>
								<Button variant="ghost" size="sm" href="/generations/{generation._id}">View</Button>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8">
						<p class="text-muted-foreground mb-4">No generations yet</p>
						<Button href="/generations/new">
							<Plus class="size-4 mr-2" />
							Create Your First Generation
						</Button>
					</div>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Study Stats</CardTitle>
				<CardDescription>Your learning progress</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-2 gap-4">
					<div class="p-4 rounded-lg bg-muted">
						<p class="text-2xl font-bold">0</p>
						<p class="text-sm text-muted-foreground">Cards Studied</p>
					</div>
					<div class="p-4 rounded-lg bg-muted">
						<p class="text-2xl font-bold">0</p>
						<p class="text-sm text-muted-foreground">Quizzes Taken</p>
					</div>
					<div class="p-4 rounded-lg bg-muted">
						<p class="text-2xl font-bold">0</p>
						<p class="text-sm text-muted-foreground">Study Streak</p>
					</div>
					<div class="p-4 rounded-lg bg-muted">
						<p class="text-2xl font-bold">0</p>
						<p class="text-sm text-muted-foreground">Documents</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
