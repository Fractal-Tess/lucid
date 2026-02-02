<script lang="ts">
	import { FileText, Sparkles, FileType, BrainCircuit } from '@lucide/svelte';
	import type { Doc, Id } from '@alpha/backend/convex/_generated/dataModel';
	import * as ContextMenu from '@alpha/ui/shadcn/context-menu';
	import { getContext } from 'svelte';
	import { TREE_CTX, type TreeContext } from './tree-context';

	interface Props {
		name: string;
		type: 'document' | 'generation';
		docType?: string; // mimeType for documents
		genType?: string; // type for generations
		id: string;
		href?: string;
	}

	let { name, type, docType, genType, id, href }: Props = $props();
	
	const { onRename, onDelete, onMove, onDownload } = getContext<TreeContext>(TREE_CTX);

	function getIcon() {
		if (type === 'generation') {
			switch (genType) {
				case 'flashcards': return FileType;
				case 'quiz': return BrainCircuit;
				default: return Sparkles;
			}
		}
		return FileText;
	}

	const Icon = getIcon();
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		{#snippet child({ props }: { props: Record<string, unknown> })}
			<a
				{href}
				{...props}
				class="flex items-center gap-2 py-1.5 px-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-md transition-colors w-full group"
			>
				<Icon class="size-4 shrink-0" />
				<span class="truncate">{name}</span>
			</a>
		{/snippet}
	</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item onclick={() => onRename(id, type, name)}>Rename</ContextMenu.Item>
		{#if type === 'document'}
			<ContextMenu.Item onclick={() => onMove(id, type)}>Move to...</ContextMenu.Item>
			<ContextMenu.Item onclick={() => onDownload(id, name)}>Download</ContextMenu.Item>
		{/if}
		<ContextMenu.Separator />
		<ContextMenu.Item class="text-red-500" onclick={() => onDelete(id, type)}>Delete</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>
