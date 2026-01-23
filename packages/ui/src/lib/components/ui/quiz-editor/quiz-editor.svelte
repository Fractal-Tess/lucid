<script lang="ts">
	import type { EditableQuizItem } from "./types.js";
	import { cn } from "@lib/utils.js";
	import { Button } from "@lib/components/ui/button/index.js";
	import { Input } from "@lib/components/ui/input/index.js";
	import { Textarea } from "@lib/components/ui/textarea/index.js";
	import * as Card from "@lib/components/ui/card/index.js";
	import { Plus, Trash2, GripVertical, Pencil, Check, X } from "@lucide/svelte";

	let {
		questions = [],
		onCreate,
		onUpdate,
		onDelete,
		onReorder,
		class: className,
		...restProps
	}: {
		questions: EditableQuizItem[];
		onCreate?: (item: {
			question: string;
			options: string[];
			correctIndex: number;
			explanation?: string;
		}) => void;
		onUpdate?: (
			id: string,
			item: {
				question: string;
				options: string[];
				correctIndex: number;
				explanation?: string;
			}
		) => void;
		onDelete?: (id: string) => void;
		onReorder?: (orderedIds: string[]) => void;
		class?: string;
	} = $props();

	let editingId = $state<string | null>(null);
	let editQuestion = $state("");
	let editOptions = $state<string[]>(["", ""]);
	let editCorrectIndex = $state(0);
	let editExplanation = $state("");
	let newQuestion = $state("");
	let newOptions = $state<string[]>(["", ""]);
	let newCorrectIndex = $state(0);
	let newExplanation = $state("");
	let showAddForm = $state(false);
	let draggedId = $state<string | null>(null);
	let dragOverId = $state<string | null>(null);

	function startEdit(question: EditableQuizItem) {
		editingId = question.id;
		editQuestion = question.question;
		editOptions = [...question.options];
		editCorrectIndex = question.correctIndex;
		editExplanation = question.explanation ?? "";
	}

	function cancelEdit() {
		editingId = null;
		editQuestion = "";
		editOptions = ["", ""];
		editCorrectIndex = 0;
		editExplanation = "";
	}

	function saveEdit() {
		if (!editingId || !editQuestion.trim()) return;
		const validOptions = editOptions.filter((o) => o.trim());
		if (validOptions.length < 2) return;
		if (editCorrectIndex < 0 || editCorrectIndex >= validOptions.length) return;

		onUpdate?.(editingId, {
			question: editQuestion.trim(),
			options: validOptions,
			correctIndex: editCorrectIndex,
			explanation: editExplanation.trim() || undefined,
		});
		cancelEdit();
	}

	function handleCreate() {
		if (!newQuestion.trim()) return;
		const validOptions = newOptions.filter((o) => o.trim());
		if (validOptions.length < 2) return;
		if (newCorrectIndex < 0 || newCorrectIndex >= validOptions.length) return;

		onCreate?.({
			question: newQuestion.trim(),
			options: validOptions,
			correctIndex: newCorrectIndex,
			explanation: newExplanation.trim() || undefined,
		});
		newQuestion = "";
		newOptions = ["", ""];
		newCorrectIndex = 0;
		newExplanation = "";
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

		const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
		const draggedIndex = sortedQuestions.findIndex((q) => q.id === draggedId);
		const targetIndex = sortedQuestions.findIndex((q) => q.id === targetId);

		if (draggedIndex === -1 || targetIndex === -1) {
			draggedId = null;
			dragOverId = null;
			return;
		}

		const newOrder = [...sortedQuestions];
		const [removed] = newOrder.splice(draggedIndex, 1);
		newOrder.splice(targetIndex, 0, removed);

		onReorder?.(newOrder.map((q) => q.id));
		draggedId = null;
		dragOverId = null;
	}

	function handleDragEnd() {
		draggedId = null;
		dragOverId = null;
	}

	function addOption(isEdit: boolean) {
		if (isEdit) {
			editOptions = [...editOptions, ""];
		} else {
			newOptions = [...newOptions, ""];
		}
	}

	function removeOption(isEdit: boolean, index: number) {
		if (isEdit) {
			editOptions = editOptions.filter((_, i) => i !== index);
			if (editCorrectIndex >= editOptions.length) {
				editCorrectIndex = editOptions.length - 1;
			}
		} else {
			newOptions = newOptions.filter((_, i) => i !== index);
			if (newCorrectIndex >= newOptions.length) {
				newCorrectIndex = newOptions.length - 1;
			}
		}
	}

	function isValidForm(
		question: string,
		options: string[],
		correctIndex: number
	): boolean {
		if (!question.trim()) return false;
		const validOptions = options.filter((o) => o.trim());
		if (validOptions.length < 2) return false;
		if (correctIndex < 0 || correctIndex >= validOptions.length) return false;
		return true;
	}

	let sortedQuestions = $derived([...questions].sort((a, b) => a.order - b.order));
</script>

<div class={cn("flex flex-col gap-4", className)} {...restProps}>
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold">Questions ({questions.length})</h3>
		{#if !showAddForm}
			<Button
				data-testid="add-question-button"
				variant="outline"
				size="sm"
				onclick={() => (showAddForm = true)}
			>
				<Plus class="size-4 mr-1" />
				Add Question
			</Button>
		{/if}
	</div>

	{#if showAddForm}
		<Card.Root data-testid="add-question-form" class="border-dashed border-primary">
			<Card.Content class="pt-4">
				<div class="flex flex-col gap-3">
					<div>
						<label for="new-question" class="text-sm font-medium mb-1 block"
							>Question</label
						>
						<Input
							id="new-question"
							data-testid="new-question-input"
							placeholder="Enter question..."
							bind:value={newQuestion}
						/>
					</div>
					<div>
						<div class="flex items-center justify-between mb-2">
							<label class="text-sm font-medium">Answer Options</label>
							{#if newOptions.length < 4}
								<Button
									data-testid="add-option-button"
									variant="ghost"
									size="sm"
									onclick={() => addOption(false)}
								>
									<Plus class="size-3 mr-1" />
									Add Option
								</Button>
							{/if}
						</div>
						<div class="space-y-2">
							{#each newOptions as option, index}
								<div class="flex gap-2 items-start">
									{#if index === newCorrectIndex}
										<div class="mt-2">
											<div
												class="size-4 rounded-full bg-green-500 flex items-center justify-center"
											>
												<Check class="size-3 text-white" />
											</div>
										</div>
									{:else}
										<div class="mt-2">
											<div class="size-4 rounded-full border-2 border-muted" />
										</div>
									{/if}
									<Input
										data-testid={`new-option-${index}`}
										placeholder={`Option ${String.fromCharCode(65 + index)}`}
										bind:value={newOptions[index]}
									/>
									{#if newOptions.length > 2}
										<Button
											data-testid={`remove-option-${index}`}
											variant="ghost"
											size="icon"
											class="size-8 text-destructive hover:text-destructive mt-0.5"
											onclick={() => removeOption(false, index)}
										>
											<Trash2 class="size-4" />
										</Button>
									{/if}
								</div>
							{/each}
						</div>
						{#if newOptions.length >= 2}
							<div class="mt-2 text-xs text-muted-foreground">
								Click a radio button to select the correct answer
							</div>
						{/if}
					</div>
					<div>
						<label for="new-explanation" class="text-sm font-medium mb-1 block"
							>Explanation (Optional)</label
						>
						<Textarea
							id="new-explanation"
							data-testid="new-explanation-input"
							placeholder="Explain why the answer is correct..."
							rows={3}
							bind:value={newExplanation}
						/>
					</div>
					<div class="flex gap-2 justify-end">
						<Button
							data-testid="cancel-add-button"
							variant="ghost"
							size="sm"
							onclick={() => {
								showAddForm = false;
								newQuestion = "";
								newOptions = ["", ""];
								newCorrectIndex = 0;
								newExplanation = "";
							}}
						>
							Cancel
						</Button>
						<Button
							data-testid="save-new-question-button"
							size="sm"
							disabled={!isValidForm(newQuestion, newOptions, newCorrectIndex)}
							onclick={handleCreate}
						>
							<Check class="size-4 mr-1" />
							Save
						</Button>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	{#if sortedQuestions.length === 0 && !showAddForm}
		<div
			data-testid="empty-state"
			class="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"
		>
			<p class="text-muted-foreground mb-4">No questions yet</p>
			<Button variant="outline" size="sm" onclick={() => (showAddForm = true)}>
				<Plus class="size-4 mr-1" />
				Add your first question
			</Button>
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			{#each sortedQuestions as question (question.id)}
				<Card.Root
					data-testid="question-item"
					data-question-id={question.id}
					class={cn(
						"transition-all",
						draggedId === question.id && "opacity-50",
						dragOverId === question.id && "border-primary border-2"
					)}
					draggable={editingId !== question.id}
					ondragstart={(e) => handleDragStart(e, question.id)}
					ondragover={(e) => handleDragOver(e, question.id)}
					ondragleave={handleDragLeave}
					ondrop={(e) => handleDrop(e, question.id)}
					ondragend={handleDragEnd}
				>
					<Card.Content class="py-3 px-4">
						{#if editingId === question.id}
							<div class="flex flex-col gap-3" data-testid="edit-form">
								<div>
									<label for="edit-question" class="text-sm font-medium mb-1 block"
										>Question</label
									>
									<Input
										id="edit-question"
										data-testid="edit-question-input"
										bind:value={editQuestion}
									/>
								</div>
								<div>
									<div class="flex items-center justify-between mb-2">
										<label class="text-sm font-medium">Answer Options</label>
										{#if editOptions.length < 4}
											<Button
												data-testid="add-edit-option-button"
												variant="ghost"
												size="sm"
												onclick={() => addOption(true)}
											>
												<Plus class="size-3 mr-1" />
												Add Option
											</Button>
										{/if}
									</div>
									<div class="space-y-2">
										{#each editOptions as option, index}
											<div class="flex gap-2 items-start">
												<button
													type="button"
													class="mt-2"
													onclick={() => (editCorrectIndex = index)}
													data-testid={`correct-option-${index}`}
												>
													{#if index === editCorrectIndex}
														<div
															class="size-4 rounded-full bg-green-500 flex items-center justify-center"
														>
															<Check class="size-3 text-white" />
														</div>
													{:else}
														<div
															class="size-4 rounded-full border-2 border-muted hover:border-foreground cursor-pointer"
														/>
													{/if}
												</button>
												<Input
													data-testid={`edit-option-${index}`}
													bind:value={editOptions[index]}
												/>
												{#if editOptions.length > 2}
													<Button
														data-testid={`remove-edit-option-${index}`}
														variant="ghost"
														size="icon"
														class="size-8 text-destructive hover:text-destructive mt-0.5"
														onclick={() => removeOption(true, index)}
													>
														<Trash2 class="size-4" />
													</Button>
												{/if}
											</div>
										{/each}
									</div>
									{#if editOptions.length >= 2}
										<div class="mt-2 text-xs text-muted-foreground">
											Click a radio button to select the correct answer
										</div>
									{/if}
								</div>
								<div>
									<label for="edit-explanation" class="text-sm font-medium mb-1 block"
										>Explanation (Optional)</label
									>
									<Textarea
										id="edit-explanation"
										data-testid="edit-explanation-input"
										rows={3}
										bind:value={editExplanation}
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
										disabled={!isValidForm(editQuestion, editOptions, editCorrectIndex)}
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
								>
									<GripVertical class="size-4" />
								</button>
								<div class="flex-1 min-w-0">
									<p class="font-medium text-sm" data-testid="question-text">
										{question.question}
									</p>
									<div class="mt-1 space-y-1">
										{#each question.options as option, index}
											<div class="flex items-center gap-2 text-sm">
												{#if index === question.correctIndex}
													<Check class="size-3 text-green-500" />
												{:else}
													<div class="size-3" />
												{/if}
												<span
													class={cn(
														index === question.correctIndex
															? "text-green-700 dark:text-green-400"
															: "text-muted-foreground"
													)}
												>
													{option}
												</span>
											</div>
										{/each}
									</div>
									{#if question.explanation}
										<p
											class="text-xs text-muted-foreground mt-2 italic"
											data-testid="question-explanation"
										>
											{question.explanation}
										</p>
									{/if}
								</div>
								<div class="flex gap-1">
									<Button
										data-testid="edit-button"
										variant="ghost"
										size="icon"
										class="size-8"
										onclick={() => startEdit(question)}
									>
										<Pencil class="size-4" />
									</Button>
									<Button
										data-testid="delete-button"
										variant="ghost"
										size="icon"
										class="size-8 text-destructive hover:text-destructive"
										onclick={() => handleDelete(question.id)}
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
