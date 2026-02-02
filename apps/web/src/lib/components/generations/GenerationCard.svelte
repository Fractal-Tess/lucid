<script lang="ts">
	import { 
		Brain, BookOpen, FileEdit, Sparkles, Play, Eye, Trash2, 
		Clock, CheckCircle, XCircle, Loader2, MoreVertical,
		FileType, BrainCircuit
	} from '@lucide/svelte';
	import { Card, CardContent, CardFooter, CardHeader } from '@alpha/ui/shadcn/card';
	import { Button } from '@alpha/ui/shadcn/button';
	import { Badge } from '@alpha/ui/shadcn/badge';
	import * as DropdownMenu from '@alpha/ui/shadcn/dropdown-menu';
	import type { Doc } from '@alpha/backend/convex/_generated/dataModel';
	import { goto } from '$app/navigation';

	interface Props {
		generation: Doc<'generations'>;
		onDelete: (id: string) => void;
	}

	let { generation, onDelete }: Props = $props();

	const typeConfig = {
		flashcards: { icon: FileType, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Flashcards' },
		quiz: { icon: BrainCircuit, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Quiz' },
		notes: { icon: FileEdit, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Notes' },
		summary: { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Summary' },
		study_guide: { icon: BookOpen, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Study Guide' },
		concept_map: { icon: Brain, color: 'text-pink-500', bg: 'bg-pink-500/10', label: 'Concept Map' }
	};

	const config = $derived(typeConfig[generation.type] || typeConfig.summary);
	const Icon = $derived(config.icon);

	function getStatusColor(status: string) {
		switch (status) {
			case 'ready': return 'text-green-500';
			case 'failed': return 'text-red-500';
			case 'generating': return 'text-blue-500';
			default: return 'text-muted-foreground';
		}
	}
</script>

<Card class="group hover:shadow-md transition-all duration-300 border-muted/60 hover:border-primary/20 overflow-hidden flex flex-col h-full">
	<CardHeader class="p-4 pb-2 flex-row items-start justify-between space-y-0">
		<div class="flex items-center gap-3">
			<div class="p-2.5 rounded-lg {config.bg} {config.color} transition-colors group-hover:bg-opacity-20">
				<Icon class="size-5" />
			</div>
			<div class="space-y-1">
				<h3 class="font-semibold leading-none tracking-tight line-clamp-1" title={generation.name}>
					{generation.name}
				</h3>
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<span class={getStatusColor(generation.status)}>
						{#if generation.status === 'generating'}
							<Loader2 class="size-3 animate-spin inline mr-1" />
						{:else if generation.status === 'ready'}
							<CheckCircle class="size-3 inline mr-1" />
						{:else if generation.status === 'failed'}
							<XCircle class="size-3 inline mr-1" />
						{/if}
						<span class="capitalize">{generation.status}</span>
					</span>
					<span>•</span>
					<span>{new Date(generation._creationTime).toLocaleDateString()}</span>
				</div>
			</div>
		</div>
		
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button variant="ghost" size="icon" class="h-8 w-8 -mr-2 text-muted-foreground" {...props}>
						<MoreVertical class="size-4" />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item onclick={() => goto(`/generations/${generation._id}`)}>
					<Eye class="mr-2 size-4" />
					View Details
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="text-destructive focus:text-destructive" onclick={() => onDelete(generation._id)}>
					<Trash2 class="mr-2 size-4" />
					Delete
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</CardHeader>

	<CardContent class="p-4 pt-2 flex-1">
		<p class="text-sm text-muted-foreground line-clamp-2">
			{config.label} generated from source documents.
		</p>
	</CardContent>

	<CardFooter class="p-4 pt-0">
		{#if generation.status === 'ready'}
			<Button class="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" href="/generations/{generation._id}">
				{#if generation.type === 'flashcards' || generation.type === 'quiz'}
					<Play class="size-4 fill-current" />
					Start {generation.type === 'flashcards' ? 'Review' : 'Quiz'}
				{:else}
					<Eye class="size-4" />
					View {config.label}
				{/if}
			</Button>
		{:else}
			<Button variant="secondary" class="w-full" disabled>
				{#if generation.status === 'generating'}
					<Loader2 class="size-4 mr-2 animate-spin" />
					Generating...
				{:else}
					Processing
				{/if}
			</Button>
		{/if}
	</CardFooter>
</Card>
