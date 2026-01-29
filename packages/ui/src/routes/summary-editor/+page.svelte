<script lang="ts">
	import SummaryEditor from "@lib/components/ui/summary-editor";
	import type { EditableSummarySection } from "@lib/components/ui/summary-editor";

	let sections = $state<EditableSummarySection[]>([
		{
			id: "1",
			title: "Introduction",
			content:
				"This is the introduction section. It provides an overview of the topic and sets the context for the rest of the summary.",
			order: 0,
		},
		{
			id: "2",
			title: "Key Concepts",
			content:
				"Here are the key concepts discussed:\n1. Concept A\n2. Concept B\n3. Concept C",
			order: 1,
		},
		{
			id: "3",
			title: "Conclusion",
			content:
				"In conclusion, the topic is very interesting and has many applications.",
			order: 2,
		},
	]);

	let nextId = $state(4);
	let isSaving = $state(false);

	function handleCreate(section: { title: string; content: string }) {
		sections = [
			...sections,
			{
				id: String(nextId++),
				title: section.title,
				content: section.content,
				order: sections.length,
			},
		];
		console.log("Created section:", section);
	}

	function handleUpdate(id: string, section: { title: string; content: string }) {
		sections = sections.map((s) => (s.id === id ? { ...s, ...section } : s));
		console.log("Updated section:", id, section);
	}

	function handleDelete(id: string) {
		sections = sections.filter((s) => s.id !== id);
		console.log("Deleted section:", id);
	}

	function handleReorder(orderedIds: string[]) {
		sections = sections.map((section) => ({
			...section,
			order: orderedIds.indexOf(section.id),
		}));
		console.log("Reordered sections:", orderedIds);
	}

	function handleSave() {
		isSaving = true;
		console.log("Saving summary:", sections);
		setTimeout(() => {
			isSaving = false;
			alert("Summary saved!");
		}, 1000);
	}

	function handleCancel() {
		if (confirm("Are you sure you want to cancel changes?")) {
			console.log("Cancelled editing");
		}
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-background p-8">
	<h1 class="mb-8 text-3xl font-bold">Summary Editor Demo</h1>

	<div class="w-full max-w-3xl">
		<SummaryEditor
			{sections}
			{isSaving}
			onCreate={handleCreate}
			onUpdate={handleUpdate}
			onDelete={handleDelete}
			onReorder={handleReorder}
			onSave={handleSave}
			onCancel={handleCancel}
		/>
	</div>
</div>
