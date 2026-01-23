<script lang="ts">
	import QuizEditor from "@lib/components/ui/quiz-editor";
	import type { EditableQuizItem } from "@lib/components/ui/quiz-editor";

	let questions = $state<EditableQuizItem[]>([
		{
			id: "1",
			question: "What is the capital of France?",
			options: ["London", "Paris", "Berlin", "Madrid"],
			correctIndex: 1,
			explanation: "Paris is the capital and largest city of France.",
			order: 0,
		},
		{
			id: "2",
			question: "What is 2 + 2?",
			options: ["3", "4", "5", "6"],
			correctIndex: 1,
			explanation: "2 + 2 equals 4 in basic arithmetic.",
			order: 1,
		},
		{
			id: "3",
			question: "What is the largest planet in our solar system?",
			options: ["Earth", "Mars", "Jupiter", "Saturn"],
			correctIndex: 2,
			explanation:
				"Jupiter is the largest planet, with a mass more than twice that of all the other planets combined.",
			order: 2,
		},
	]);

	let nextId = $state(4);

	function handleCreate(item: {
		question: string;
		options: string[];
		correctIndex: number;
		explanation?: string;
	}) {
		questions = [
			...questions,
			{
				id: String(nextId++),
				question: item.question,
				options: item.options,
				correctIndex: item.correctIndex,
				explanation: item.explanation,
				order: questions.length,
			},
		];
		console.log("Created question:", item);
	}

	function handleUpdate(
		id: string,
		item: {
			question: string;
			options: string[];
			correctIndex: number;
			explanation?: string;
		}
	) {
		questions = questions.map((q) => (q.id === id ? { ...q, ...item } : q));
		console.log("Updated question:", id, item);
	}

	function handleDelete(id: string) {
		questions = questions.filter((q) => q.id !== id);
		console.log("Deleted question:", id);
	}

	function handleReorder(orderedIds: string[]) {
		questions = questions.map((question) => ({
			...question,
			order: orderedIds.indexOf(question.id),
		}));
		console.log("Reordered questions:", orderedIds);
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-background p-8">
	<h1 class="mb-8 text-3xl font-bold">Quiz Editor Demo</h1>

	<div class="w-full max-w-3xl">
		<QuizEditor
			questions={questions}
			onCreate={handleCreate}
			onUpdate={handleUpdate}
			onDelete={handleDelete}
			onReorder={handleReorder}
		/>
	</div>
</div>
