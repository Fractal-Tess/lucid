<script lang="ts">
	import * as Card from "@lib/components/ui/card/index.js";
	import * as Accordion from "@lib/components/ui/accordion/index.js";
	import { Badge } from "@lib/components/ui/badge/index.js";
	import type { NotesData } from "./types.js";
	import { Lightbulb } from "@lucide/svelte";

	let { notes }: { notes: NotesData } = $props();
</script>

<div class="space-y-6">
	<Card.Root>
		<Card.Header>
			<Card.Title>Notes</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="prose prose-sm dark:prose-invert max-w-none">
				{@html notes.content
					.replace(/^### (.*$)/gim, '<h3>$1</h3>')
					.replace(/^## (.*$)/gim, '<h2>$1</h2>')
					.replace(/^# (.*$)/gim, '<h1>$1</h1>')
					.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
					.replace(/\*(.*?)\*/g, '<em>$1</em>')
					.replace(/^- (.*$)/gim, '<li>$1</li>')
					.replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
					.replace(/<\/li>\n<li>/g, '</li><li>')
					.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
					.replace(/\n/g, '<br/>')}
			</div>
		</Card.Content>
	</Card.Root>

	{#if notes.keyPoints.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Lightbulb class="size-5 text-yellow-500" />
					Key Points
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<ul class="space-y-2">
					{#each notes.keyPoints as point, i (i)}
						<li class="flex items-start gap-3">
							<Badge variant="secondary" class="mt-0.5 shrink-0">{i + 1}</Badge>
							<span class="text-muted-foreground leading-relaxed">{point}</span>
						</li>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
