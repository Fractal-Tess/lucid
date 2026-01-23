<script lang="ts">
	import QuizResultsSummary from "@lib/components/ui/quiz-results-summary/index.js";
	import type { QuizItem, QuizResults } from "@lib/components/ui/quiz-results-summary/index.js";

	const sampleQuestions: QuizItem[] = [
		{
			id: "1",
			question: "What is the capital of France?",
			options: ["London", "Paris", "Berlin", "Madrid"],
			correctIndex: 1,
			explanation:
				"Paris is the capital and largest city of France, located in the north-central part of the country.",
		},
		{
			id: "2",
			question: "What is 2 + 2?",
			options: ["3", "4", "5", "6"],
			correctIndex: 1,
			explanation: "2 plus 2 equals 4, which is a basic arithmetic fact.",
		},
		{
			id: "3",
			question: "What is the largest planet in our solar system?",
			options: ["Earth", "Mars", "Jupiter", "Saturn"],
			correctIndex: 2,
			explanation:
				"Jupiter is the largest planet in our solar system, with a mass more than two and a half times that of all the other planets combined.",
		},
	];

	let duration = $state(120);

	let score = $state(2);

	let correctAnswers = $state([
		{ questionId: "1", selectedIndex: 1, isCorrect: true },
		{ questionId: "3", selectedIndex: 2, isCorrect: true },
	]);

	let wrongAnswers = $state([
		{ questionId: "2", selectedIndex: 0, isCorrect: false },
	]);

	let results = $derived<QuizResults>({
		score,
		total: sampleQuestions.length,
		correctAnswers,
		wrongAnswers,
	});

	function handleRetakeQuiz() {
		console.log("Retake quiz clicked");
		score = 0;
		correctAnswers = [];
		wrongAnswers = [];
	}

	function handleReviewQuestion(questionId: string) {
		console.log("Review question:", questionId);
	}

	function handleExportResults() {
		console.log("Export results clicked");
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-background p-8">
	<h1 class="mb-8 text-3xl font-bold">Quiz Results Summary Demo</h1>

	<div class="mb-8 flex flex-wrap gap-4">
		<div class="flex items-center gap-2">
			<label for="duration-input" class="text-sm font-medium">Duration (s):</label>
			<input
				id="duration-input"
				type="number"
				bind:value={duration}
				min="0"
				class="w-20 rounded border px-2 py-1"
			/>
		</div>

		<div class="flex items-center gap-2">
			<label for="score-input" class="text-sm font-medium">Score:</label>
			<input
				id="score-input"
				type="number"
				bind:value={score}
				min="0"
				max={sampleQuestions.length}
				class="w-20 rounded border px-2 py-1"
			/>
		</div>
	</div>

	<QuizResultsSummary
		{questions}
		{results}
		{duration}
		showQuestionReview
		onRetakeQuiz={handleRetakeQuiz}
		onReviewQuestion={handleReviewQuestion}
		onExportResults={handleExportResults}
	/>

	<div class="mt-8 flex flex-col gap-2 text-sm text-muted-foreground">
		<p>Use the controls above to adjust:</p>
		<ul class="list-inside list-disc">
			<li>Duration: Time taken to complete the quiz</li>
			<li>Score: Number of correct answers</li>
		</ul>
	</div>
</div>
