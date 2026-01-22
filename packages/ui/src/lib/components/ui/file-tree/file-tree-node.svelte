<script lang="ts">
	import { getFileTreeContext } from "./ctx.svelte.js";
	import type { FileNode } from "./types.js";
	import { cn } from "@lib/utils.js";
	import {
		ChevronRight,
		ChevronDown,
		Folder,
		FolderOpen,
		FileText,
		Book,
		Layers,
		Sparkles,
		File
	} from "@lucide/svelte";
	import FileTreeNode from "./file-tree-node.svelte";

	let { node, depth = 0 } = $props<{ node: FileNode; depth?: number }>();

	const ctx = getFileTreeContext();

	// Derived state
	let expanded = $derived(ctx.expandedIds.has(node.id));
	let selected = $derived(ctx.selectedId === node.id);
	let isContainer = $derived(["group", "subject", "folder"].includes(node.type));
	let hasChildren = $derived(node.children && node.children.length > 0);

	// Local state for drag feedback
	let dropState = $state<{
		position: "before" | "after" | "inside" | null;
		active: boolean;
	}>({ position: null, active: false });

	function handleClick(e: MouseEvent) {
		e.stopPropagation();
		ctx.onSelect(node);
		if (isContainer) {
			ctx.onToggle(node);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			e.stopPropagation();
			ctx.onSelect(node);
			if (isContainer) {
				ctx.onToggle(node);
			}
		}
		// Basic arrow navigation could be implemented here or in parent
	}

	// Drag Handlers
	function handleDragStart(e: DragEvent) {
		e.stopPropagation();
		if (!e.dataTransfer) return;
		e.dataTransfer.setData("text/plain", node.id);
		e.dataTransfer.effectAllowed = "move";
		// Small delay to let the ghost image generate before hiding the element (optional)
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (!e.dataTransfer) return;
		e.dataTransfer.dropEffect = "move";

		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const offsetY = e.clientY - rect.top;
		const height = rect.height;

		// Zones: Top 25% -> before, Bottom 25% -> after, Middle 50% -> inside (if container)
		// If not container, Middle 50% -> append to parent (conceptually 'after' or 'before')
		// For simplicity/precision:
		// If container:
		// < 25%: before
		// > 75%: after
		// 25-75%: inside
		// If leaf:
		// < 50%: before
		// > 50%: after

		if (isContainer) {
			if (offsetY < height * 0.25) {
				dropState.position = "before";
			} else if (offsetY > height * 0.75) {
				dropState.position = "after";
			} else {
				dropState.position = "inside";
			}
		} else {
			if (offsetY < height * 0.5) {
				dropState.position = "before";
			} else {
				dropState.position = "after";
			}
		}
		dropState.active = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.stopPropagation();
		dropState.active = false;
		dropState.position = null;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dropState.active = false;
		
		const sourceId = e.dataTransfer?.getData("text/plain");
		if (!sourceId || sourceId === node.id) return;
		
		if (dropState.position) {
			ctx.onReorder(sourceId, node.id, dropState.position);
		}
		dropState.position = null;
	}

	// Icon selection
	function getIcon() {
		if (node.icon) return node.icon;
		switch (node.type) {
			case "group": return Layers;
			case "subject": return Book;
			case "folder": return expanded ? FolderOpen : Folder;
			case "document": return FileText;
			case "generation": return Sparkles;
			default: return File;
		}
	}

	const Icon = getIcon();
</script>

<div class="select-none text-sm">
	<!-- Node Row -->
	<div
		role="treeitem"
		aria-selected={selected}
		aria-expanded={isContainer ? expanded : undefined}
		tabindex="0"
		class={cn(
			"group/row relative flex items-center gap-2 rounded-sm px-2 py-1.5 transition-colors outline-none",
			selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
			// Drag visual states
			dropState.active && dropState.position === "inside" && "bg-accent/30 ring-2 ring-primary ring-inset",
		)}
		style="padding-left: {depth * ctx.indentSize + 8}px"
		onclick={handleClick}
		onkeydown={handleKeyDown}
		draggable="true"
		ondragstart={handleDragStart}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
	>
		<!-- Drop Indicators (Lines) -->
		{#if dropState.active && dropState.position === 'before'}
			<div class="absolute top-0 left-0 right-0 h-0.5 bg-primary pointer-events-none"></div>
		{/if}
		{#if dropState.active && dropState.position === 'after'}
			<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary pointer-events-none"></div>
		{/if}

		<!-- Expand/Collapse Chevron -->
		{#if isContainer}
			<button
				type="button"
				class="h-4 w-4 shrink-0 rounded-sm hover:bg-muted-foreground/20 flex items-center justify-center transition-transform"
				class:rotate-90={expanded}
				onclick={(e) => {
					e.stopPropagation();
					ctx.onToggle(node);
				}}
			>
				<ChevronRight class="size-3.5 text-muted-foreground/70" />
			</button>
		{:else}
			<span class="w-4"></span>
		{/if}

		<!-- Icon -->
		<Icon class={cn("size-4 shrink-0", node.color ? `text-[${node.color}]` : "text-muted-foreground")} />

		<!-- Label -->
		<span class="truncate font-medium flex-1">
			{node.name}
		</span>
	</div>

	<!-- Children -->
	{#if isContainer && expanded && node.children}
		<div role="group">
			{#each node.children as child (child.id)}
				<FileTreeNode node={child} depth={depth + 1} />
			{/each}
		</div>
	{/if}
</div>
