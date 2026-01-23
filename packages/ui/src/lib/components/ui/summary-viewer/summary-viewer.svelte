<script lang="ts">
	import type { SummaryData } from "./types.js";
	import { cn } from "@lib/utils.js";
	import * as Card from "@lib/components/ui/card/index.js";
	import * as Accordion from "@lib/components/ui/accordion/index.js";

	let {
		summary,
		class: className,
		...restProps
	}: {
		summary?: SummaryData | null;
		class?: string;
	} = $props();
</script>

<div class={cn("w-full space-y-6", className)} {...restProps}>
	{#if !summary}
		<div
			data-testid="empty-state"
			class="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center"
		>
			<p class="text-muted-foreground">No summary available</p>
		</div>
	{:else}
		<Card.Root class="w-full">
			<Card.Header>
				<Card.Title>Summary Overview</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
					{summary.content}
				</p>
			</Card.Content>
		</Card.Root>

		{#if summary.sections && summary.sections.length > 0}
			<div class="space-y-4">
				<h3 class="text-lg font-semibold tracking-tight">Detailed Sections</h3>
				<Accordion.Root type="multiple" class="w-full">
					{#each summary.sections as section, i}
						<Accordion.Item value={`item-${i}`}>
							<Accordion.Trigger data-testid={`section-trigger-${i}`}>
								{section.title}
							</Accordion.Trigger>
							<Accordion.Content>
								<div class="whitespace-pre-wrap py-2 text-sm leading-relaxed text-muted-foreground">
									{section.content}
								</div>
							</Accordion.Content>
						</Accordion.Item>
					{/each}
				</Accordion.Root>
			</div>
		{/if}
	{/if}
</div>
