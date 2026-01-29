<script lang="ts">
	import { cn } from "@lib/utils.js";
	import { Button } from "@lib/components/ui/button/index.js";
	import { Textarea } from "@lib/components/ui/textarea/index.js";
	import { Input } from "@lib/components/ui/input/index.js";
	import * as Card from "@lib/components/ui/card/index.js";
	import { Badge } from "@lib/components/ui/badge/index.js";
	import { Tabs, TabsContent, TabsList, TabsTrigger } from "@lib/components/ui/tabs/index.js";
	import type { EditableNotesData } from "./types.js";
	import { Plus, Trash2, Pencil, Check, X, Save, Loader2, Eye, FileText, Lightbulb } from "@lucide/svelte";

	let {
		notes,
		isSaving = false,
		onUpdate,
		onSave,
		onCancel,
		class: className,
		...restProps
	}: {
		notes: EditableNotesData;
		isSaving?: boolean;
		onUpdate?: (notes: { content: string; keyPoints: string[] }) => void;
		onSave?: () => void;
		onCancel?: () => void;
		class?: string;
	} = $props();

	let editContent = $state(notes.content);
	let editKeyPoints = $state([...notes.keyPoints]);
	let editingKeyPointIndex = $state<number | null>(null);
	let editKeyPointText = $state("");
	let newKeyPoint = $state("");
	let hasChanges = $derived(
		editContent !== notes.content ||
		JSON.stringify(editKeyPoints) !== JSON.stringify(notes.keyPoints)
	);

	function startEditKeyPoint(index: number) {
		editingKeyPointIndex = index;
		editKeyPointText = editKeyPoints[index] ?? "";
	}

	function cancelEditKeyPoint() {
		editingKeyPointIndex = null;
		editKeyPointText = "";
	}

	function saveEditKeyPoint() {
		if (editingKeyPointIndex === null || !editKeyPointText.trim()) return;
		const newPoints = [...editKeyPoints];
		newPoints[editingKeyPointIndex] = editKeyPointText.trim();
		editKeyPoints = newPoints;
		editingKeyPointIndex = null;
		editKeyPointText = "";
	}

	function handleAddKeyPoint() {
		if (!newKeyPoint.trim()) return;
		editKeyPoints = [...editKeyPoints, newKeyPoint.trim()];
		newKeyPoint = "";
	}

	function handleDeleteKeyPoint(index: number) {
		editKeyPoints = editKeyPoints.filter((_, i) => i !== index);
	}

	function handleSave() {
		onUpdate?.({ content: editContent, keyPoints: editKeyPoints });
		onSave?.();
	}

	function handleCancel() {
		editContent = notes.content;
		editKeyPoints = [...notes.keyPoints];
		editingKeyPointIndex = null;
		editKeyPointText = "";
		newKeyPoint = "";
		onCancel?.();
	}

	function renderMarkdown(content: string): string {
		return content
			.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
			.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
			.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
			.replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4">$2</li>')
			.replace(/(<li[^>]*>.*?<\/li>\n?)+/gs, '<ul class="list-disc space-y-1 my-2">$1</ul>')
			.replace(/\n/g, '<br/>');
	}
</script>

<div class={cn("flex flex-col gap-4", className)} {...restProps}>
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold">Edit Notes</h3>
		<div class="flex gap-2">
			{#if onSave}
				<Button
					data-testid="save-notes-button"
					size="sm"
					onclick={handleSave}
					disabled={isSaving || !hasChanges}
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
					data-testid="cancel-notes-button"
					variant="ghost"
					size="sm"
					onclick={handleCancel}
					disabled={isSaving}
				>
					Cancel
				</Button>
			{/if}
		</div>
	</div>

	<Tabs value="edit" class="w-full">
		<TabsList class="grid w-full grid-cols-2">
			<TabsTrigger value="edit">
				<FileText class="size-4 mr-2" />
				Edit
			</TabsTrigger>
			<TabsTrigger value="preview">
				<Eye class="size-4 mr-2" />
				Preview
			</TabsTrigger>
		</TabsList>

		<TabsContent value="edit" class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">Content</Card.Title>
				</Card.Header>
				<Card.Content>
					<Textarea
						data-testid="notes-content-input"
						placeholder="Enter your notes in Markdown format..."
						rows={12}
						bind:value={editContent}
						disabled={isSaving}
						class="font-mono text-sm"
					/>
					<p class="text-xs text-muted-foreground mt-2">
						Supports Markdown: **bold**, *italic*, # headers, - lists
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base flex items-center gap-2">
						<Lightbulb class="size-4 text-yellow-500" />
						Key Points ({editKeyPoints.length})
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-2">
						{#each editKeyPoints as point, i (i)}
							<div class="flex items-start gap-2">
								<Badge variant="secondary" class="mt-2 shrink-0">{i + 1}</Badge>
								{#if editingKeyPointIndex === i}
									<div class="flex-1 flex gap-2">
										<Input
											data-testid="edit-keypoint-input"
											bind:value={editKeyPointText}
											placeholder="Edit key point..."
											disabled={isSaving}
										/>
										<Button
											data-testid="save-keypoint-button"
											variant="ghost"
											size="icon"
											class="size-8"
											onclick={saveEditKeyPoint}
											disabled={!editKeyPointText.trim()}
										>
											<Check class="size-4" />
										</Button>
										<Button
											data-testid="cancel-keypoint-button"
											variant="ghost"
											size="icon"
											class="size-8"
											onclick={cancelEditKeyPoint}
										>
											<X class="size-4" />
										</Button>
									</div>
								{:else}
									<span class="flex-1 text-sm py-2">{point}</span>
									<Button
										data-testid="edit-keypoint-button"
										variant="ghost"
										size="icon"
										class="size-8"
										onclick={() => startEditKeyPoint(i)}
										disabled={isSaving}
									>
										<Pencil class="size-4" />
									</Button>
									<Button
										data-testid="delete-keypoint-button"
										variant="ghost"
										size="icon"
										class="size-8 text-destructive hover:text-destructive"
										onclick={() => handleDeleteKeyPoint(i)}
										disabled={isSaving}
									>
										<Trash2 class="size-4" />
									</Button>
								{/if}
							</div>
						{/each}

						<div class="flex items-start gap-2 pt-2 border-t">
							<Badge variant="outline" class="mt-2 shrink-0">+</Badge>
							<Input
								data-testid="new-keypoint-input"
								bind:value={newKeyPoint}
								placeholder="Add a new key point..."
								disabled={isSaving}
								class="flex-1"
								onkeydown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddKeyPoint();
									}
								}}
							/>
							<Button
								data-testid="add-keypoint-button"
								size="icon"
								class="size-8"
								onclick={handleAddKeyPoint}
								disabled={!newKeyPoint.trim() || isSaving}
							>
								<Plus class="size-4" />
							</Button>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</TabsContent>

		<TabsContent value="preview">
			<Card.Root>
				<Card.Content class="pt-6">
					<div class="prose prose-sm dark:prose-invert max-w-none">
						{@html renderMarkdown(editContent)}
					</div>

					{#if editKeyPoints.length > 0}
						<div class="mt-6 pt-6 border-t">
							<h4 class="text-sm font-semibold mb-3 flex items-center gap-2">
								<Lightbulb class="size-4 text-yellow-500" />
								Key Points
							</h4>
							<ul class="space-y-2">
								{#each editKeyPoints as point, i (i)}
									<li class="flex items-start gap-3">
										<Badge variant="secondary" class="mt-0.5 shrink-0">{i + 1}</Badge>
										<span class="text-muted-foreground text-sm">{point}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</TabsContent>
	</Tabs>
</div>
