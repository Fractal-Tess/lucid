<script lang="ts">
	import { setFileTreeContext } from "./ctx.svelte.js";
	import type { FileTreeData, FileNode } from "./types.js";
	import FileTreeNode from "./file-tree-node.svelte";
	import { cn } from "@lib/utils.js";

	let {
		data,
		expandedIds = $bindable(new Set()),
		selectedId = $bindable(null),
		indentSize = 16,
		class: className,
		onSelect,
		onToggle,
		onReorder,
		...props
	} = $props<{
		data: FileTreeData;
		expandedIds?: Set<string>;
		selectedId?: string | null;
		indentSize?: number;
		class?: string;
		onSelect?: (node: FileNode) => void;
		onToggle?: (node: FileNode, expanded: boolean) => void;
		onReorder?: (sourceId: string, targetId: string, position: "before" | "after" | "inside") => void;
	}>();

	let draggedNodeId = $state<string | null>(null);

	function handleSelect(node: FileNode) {
		selectedId = node.id;
		onSelect?.(node);
	}

	function handleToggle(node: FileNode) {
		const next = new Set(expandedIds);
		if (next.has(node.id)) {
			next.delete(node.id);
		} else {
			next.add(node.id);
		}
		expandedIds = next;
		onToggle?.(node, next.has(node.id));
	}

	function handleReorder(sourceId: string, targetId: string, position: "before" | "after" | "inside") {
		onReorder?.(sourceId, targetId, position);
	}

	// Context with getters for reactivity
	setFileTreeContext({
		get selectedId() {
			return selectedId;
		},
		get expandedIds() {
			return expandedIds;
		},
		get draggedNodeId() {
			return draggedNodeId;
		},
		get indentSize() {
			return indentSize;
		},
		onSelect: handleSelect,
		onToggle: handleToggle,
		onReorder: handleReorder
	} as any);
</script>

<div role="tree" class={cn("w-full select-none", className)} {...props}>
	{#if data.length === 0}
		<div class="p-4 text-center text-sm text-muted-foreground">
			No files found
		</div>
	{:else}
		{#each data as node (node.id)}
			<FileTreeNode {node} />
		{/each}
	{/if}
</div>
