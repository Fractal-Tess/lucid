<script lang="ts">
	import type { EditableSummarySection } from "./types.js";
	import { cn } from "@lib/utils.js";
	import { Button } from "@lib/components/ui/button/index.js";
	import { Input } from "@lib/components/ui/input/index.js";
	import { Textarea } from "@lib/components/ui/textarea/index.js";
	import * as Card from "@lib/components/ui/card/index.js";
	import { Plus, Trash2, GripVertical, Pencil, Check, X, Save, Loader2 } from "@lucide/svelte";

	let {
		sections = [],
		isSaving = false,
		onCreate,
		onUpdate,
		onDelete,
		onReorder,
		onSave,
		onCancel,
		class: className,
		...restProps
	}: {
		sections: EditableSummarySection[];
		isSaving?: boolean;
		onCreate?: (section: { title: string; content: string }) => void;
		onUpdate?: (id: string, section: { title: string; content: string }) => void;
		onDelete?: (id: string) => void;
		onReorder?: (orderedIds: string[]) => void;
		onSave?: () => void;
		onCancel?: () => void;
		class?: string;
	} = $props();

	let editingId = $state<string | null>(null);
	let editTitle = $state("");
	let editContent = $state("");

	let newTitle = $state("");
	let newContent = $state("");
	let showAddForm = $state(false);

	let draggedId = $state<string | null>(null);
	let dragOverId = $state<string | null>(null);

	function startEdit(section: EditableSummarySection) {
		editingId = section.id;
		editTitle = section.title;
		editContent = section.content;
	}

	function cancelEdit() {
		editingId = null;
		editTitle = "";
		editContent = "";
	}

	function saveEdit() {
		if (!editingId || !editTitle.trim() || !editContent.trim()) return;
		onUpdate?.(editingId, { title: editTitle.trim(), content: editContent.trim() });
		cancelEdit();
	}

	function handleCreate() {
		if (!newTitle.trim() || !newContent.trim()) return;
		onCreate?.({ title: newTitle.trim(), content: newContent.trim() });
		newTitle = "";
		newContent = "";
		showAddForm = false;
	}

	function handleDelete(id: string) {
		onDelete?.(id);
	}

	function handleDragStart(e: DragEvent, id: string) {
		draggedId = id;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", id);
		}
	}

	function handleDragOver(e: DragEvent, id: string) {
		e.preventDefault();
		if (draggedId && draggedId !== id) {
			dragOverId = id;
		}
	}

	function handleDragLeave() {
		dragOverId = null;
	}

	function handleDrop(e: DragEvent, targetId: string) {
		e.preventDefault();
		if (!draggedId || draggedId === targetId) {
			draggedId = null;
			dragOverId = null;
			return;
		}

		const sortedSections = [...sections].sort((a, b) => a.order - b.order);
		const draggedIndex = sortedSections.findIndex((s) => s.id === draggedId);
		const targetIndex = sortedSections.findIndex((s) => s.id === targetId);

		if (draggedIndex === -1 || targetIndex === -1) {
			draggedId = null;
			dragOverId = null;
			return;
		}

		const newOrder = [...sortedSections];
		const [removed] = newOrder.splice(draggedIndex, 1);
		newOrder.splice(targetIndex, 0, removed);

		onReorder?.(newOrder.map((s) => s.id));
		draggedId = null;
		dragOverId = null;
	}

	function handleDragEnd() {
		draggedId = null;
		dragOverId = null;
	}

	let sortedSections = $derived([...sections].sort((a, b) => a.order - b.order));
</script>

<div class={cn("flex flex-col gap-4", className)} {...restProps}>
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold">Summary Sections ({sections.length})</h3>
		<div class="flex gap-2">
			{#if !showAddForm}
				<Button
					data-testid="add-section-button"
					variant="outline"
					size="sm"
					onclick={() => (showAddForm = true)}
					disabled={isSaving}
				>
					<Plus class="size-4 mr-1" />
					Add Section
				</Button>
			{/if}
			{#if onSave}
				<Button
					data-testid="save-summary-button"
					size="sm"
					onclick={onSave}
					disabled={isSaving}
				>
					{#if isSaving}
						<Loader2 class="size-4 mr-1 animate-spin" />
						Saving...
					{:else}
						<Save class="size-4 mr-1" />
						Save Changes
					{/if}
				</Button>
			{/if}
			{#if onCancel}
				<Button
					data-testid="cancel-summary-button"
					variant="ghost"
					size="sm"
					onclick={onCancel}
					disabled={isSaving}
				>
					Cancel
				</Button>
			{/if}
		</div>
	</div>

	{#if showAddForm}
		<Card.Root data-testid="add-section-form" class="border-dashed border-primary">
			<Card.Content class="pt-4">
				<div class="flex flex-col gap-3">
					<div>
						<label for="new-title" class="text-sm font-medium mb-1 block">Title</label>
						<Input
							id="new-title"
							data-testid="new-title-input"
							placeholder="Section Title..."
							bind:value={newTitle}
						/>
					</div>
					<div>
						<label for="new-content" class="text-sm font-medium mb-1 block">Content</label>
						<Textarea
							id="new-content"
							data-testid="new-content-input"
							placeholder="Section Content..."
							rows={4}
							bind:value={newContent}
						/>
					</div>
					<div class="flex gap-2 justify-end">
						<Button
							data-testid="cancel-add-button"
							variant="ghost"
							size="sm"
							onclick={() => {
								showAddForm = false;
								newTitle = "";
								newContent = "";
							}}
						>
							Cancel
						</Button>
						<Button
							data-testid="save-new-section-button"
							size="sm"
							disabled={!newTitle.trim() || !newContent.trim()}
							onclick={handleCreate}
						>
							<Check class="size-4 mr-1" />
							Add
						</Button>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	{#if sortedSections.length === 0 && !showAddForm}
		<div
			data-testid="empty-state"
			class="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"
		>
			<p class="text-muted-foreground mb-4">No sections yet</p>
			<Button variant="outline" size="sm" onclick={() => (showAddForm = true)} disabled={isSaving}>
				<Plus class="size-4 mr-1" />
				Add your first section
			</Button>
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			{#each sortedSections as section (section.id)}
				<Card.Root
					data-testid="section-item"
					data-section-id={section.id}
					class={cn(
						"transition-all",
						draggedId === section.id && "opacity-50",
						dragOverId === section.id && "border-primary border-2"
					)}
					draggable={editingId !== section.id && !isSaving}
					ondragstart={(e) => handleDragStart(e, section.id)}
					ondragover={(e) => handleDragOver(e, section.id)}
					ondragleave={handleDragLeave}
					ondrop={(e) => handleDrop(e, section.id)}
					ondragend={handleDragEnd}
				>
					<Card.Content class="py-3 px-4">
						{#if editingId === section.id}
							<div class="flex flex-col gap-3" data-testid="edit-form">
								<div>
									<label for="edit-title" class="text-sm font-medium mb-1 block">Title</label>
									<Input
										id="edit-title"
										data-testid="edit-title-input"
										bind:value={editTitle}
									/>
								</div>
								<div>
									<label for="edit-content" class="text-sm font-medium mb-1 block">Content</label>
									<Textarea
										id="edit-content"
										data-testid="edit-content-input"
										rows={4}
										bind:value={editContent}
									/>
								</div>
								<div class="flex gap-2 justify-end">
									<Button
										data-testid="cancel-edit-button"
										variant="ghost"
										size="sm"
										onclick={cancelEdit}
									>
										<X class="size-4" />
									</Button>
									<Button
										data-testid="save-edit-button"
										size="sm"
										disabled={!editTitle.trim() || !editContent.trim()}
										onclick={saveEdit}
									>
										<Check class="size-4" />
									</Button>
								</div>
							</div>
						{:else}
							<div class="flex items-start gap-3">
								<button
									type="button"
									class="cursor-grab text-muted-foreground hover:text-foreground mt-1"
									aria-label="Drag to reorder"
									data-testid="drag-handle"
									disabled={isSaving}
								>
									<GripVertical class="size-4" />
								</button>
								<div class="flex-1 min-w-0">
									<h4 class="font-medium text-sm" data-testid="section-title">{section.title}</h4>
									<p
										class="text-sm text-muted-foreground mt-1 whitespace-pre-wrap"
										data-testid="section-content"
									>
										{section.content}
									</p>
								</div>
								<div class="flex gap-1">
									<Button
										data-testid="edit-button"
										variant="ghost"
										size="icon"
										class="size-8"
										onclick={() => startEdit(section)}
										disabled={isSaving}
									>
										<Pencil class="size-4" />
									</Button>
									<Button
										data-testid="delete-button"
										variant="ghost"
										size="icon"
										class="size-8 text-destructive hover:text-destructive"
										onclick={() => handleDelete(section.id)}
										disabled={isSaving}
									>
										<Trash2 class="size-4" />
									</Button>
								</div>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
