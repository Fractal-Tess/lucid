<script lang="ts">
	import type { QuizItem, QuizAnswer, QuizResults } from "./types.js";
	import { ChevronLeft, ChevronRight } from "@lucide/svelte";
	import { Button } from "@lib/components/ui/button/index.js";
	import { cn } from "@lib/utils.js";
	import QuizResultsSummary from "@lib/components/ui/quiz-results-summary/index.js";

	let {
		questions = [],
		onAnswer,
		onComplete,
		class: className,
		...restProps
	}: {
		questions: QuizItem[];
		onAnswer?: (answer: QuizAnswer) => void;
		onComplete?: (results: QuizResults) => void;
		class?: string;
	} = $props();

	let currentIndex = $state(0);
	let selectedOptionIndex = $state<number | null>(null);
	let isAnswered = $state(false);
	let quizComplete = $state(false);
	let answeredQuestions = $state<Set<number>>(new Set());
	let startTime = $state<number | null>(null);
	let duration = $state(0);

	$effect(() => {
		if (questions.length > 0 && !startTime && !quizComplete) {
			startTime = Date.now();
		}

		if (quizComplete && startTime) {
			duration = Math.floor((Date.now() - startTime) / 1000);
		}
	});

	let currentQuestion = $derived(questions[currentIndex] ?? null);
	let hasPrev = $derived(currentIndex > 0);
	let hasNext = $derived(currentIndex < questions.length - 1);

	let answers = $state<QuizAnswer[]>([]);
	let correctCount = $derived(answers.filter((a) => a.isCorrect).length);

	let score = $derived({
		score: correctCount,
		total: questions.length,
		correctAnswers: answers.filter((a) => a.isCorrect),
		wrongAnswers: answers.filter((a) => !a.isCorrect),
	});

	function handleOptionClick(index: number) {
		if (isAnswered || !currentQuestion) return;

		selectedOptionIndex = index;
		isAnswered = true;
		answeredQuestions.add(currentIndex);

		const isCorrect = index === currentQuestion.correctIndex;

		const answer: QuizAnswer = {
			questionId: currentQuestion.id,
			selectedIndex: index,
			isCorrect,
		};

		answers.push(answer);
		onAnswer?.(answer);
	}

	function nextQuestion() {
		if (!hasNext) {
			finishQuiz();
			return;
		}

		currentIndex++;
		const prevAnswer = answeredQuestions.has(currentIndex);
		if (prevAnswer) {
			const existingAnswer = answers.find((a) => a.questionId === questions[currentIndex].id);
			selectedOptionIndex = existingAnswer?.selectedIndex ?? null;
			isAnswered = true;
		} else {
			selectedOptionIndex = null;
			isAnswered = false;
		}
	}

	function prevQuestion() {
		if (!hasPrev) return;

		currentIndex--;
		const prevAnswer = answeredQuestions.has(currentIndex);
		if (prevAnswer) {
			const existingAnswer = answers.find((a) => a.questionId === questions[currentIndex].id);
			selectedOptionIndex = existingAnswer?.selectedIndex ?? null;
			isAnswered = true;
		} else {
			selectedOptionIndex = null;
			isAnswered = false;
		}
	}

	function finishQuiz() {
		quizComplete = true;
		onComplete?.(score);
	}

	function restartQuiz() {
		currentIndex = 0;
		selectedOptionIndex = null;
		isAnswered = false;
		quizComplete = false;
		answers = [];
		answeredQuestions.clear();
		startTime = Date.now();
		duration = 0;
	}

	function getOptionVariant(index: number): "default" | "outline" | "ghost" {
		if (!isAnswered) return "outline";

		if (index === currentQuestion?.correctIndex) {
			return "default";
		}

		if (index === selectedOptionIndex && !currentQuestion) {
			return "outline";
		}

		if (index === selectedOptionIndex) {
			return "outline";
		}

		return "ghost";
	}

	function getOptionClass(index: number): string {
		if (!isAnswered || !currentQuestion) return "";

		const isCorrect = index === currentQuestion.correctIndex;
		const isSelected = index === selectedOptionIndex;

		if (isCorrect) {
			return "bg-green-500 hover:bg-green-600 text-white border-green-500";
		}

		if (isSelected && !isCorrect) {
			return "bg-red-500 hover:bg-red-600 text-white border-red-500";
		}

		return "opacity-50";
	}
</script>

<div
	class={cn("flex flex-col items-center gap-6", className)}
	{...restProps}
	tabindex="-1"
	role="group"
	aria-label="Quiz"
>
	{#if questions.length === 0}
		<div
			data-testid="empty-state"
			class="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center"
		>
			<p class="text-muted-foreground">No questions to display</p>
		</div>
	{:else if quizComplete}
		<QuizResultsSummary
			data-testid="quiz-results"
			{questions}
			results={score}
			duration={duration}
			showQuestionReview
			onRetakeQuiz={restartQuiz}
		/>
	{:else if currentQuestion}
		<div data-testid="quiz-container" class="w-full max-w-3xl">
			<div class="mb-6 flex items-center justify-between">
				<div data-testid="question-counter" class="text-sm font-medium text-muted-foreground">
					Question {currentIndex + 1} / {questions.length}
				</div>
			</div>

			<div
				class="mb-6 rounded-lg border-2 border-border bg-card p-6"
				role="region"
				aria-label="Quiz question"
			>
				<h3
					data-testid="quiz-question"
					class="mb-6 text-xl font-semibold text-card-foreground"
				>
					{currentQuestion.question}
				</h3>

				<div class="space-y-3">
					{#each currentQuestion.options as option, index}
						<Button
							data-testid="quiz-option-{index}"
							variant={getOptionVariant(index)}
							class={cn(
								"w-full justify-start text-left py-6 px-4 h-auto text-base",
								getOptionClass(index)
							)}
							disabled={isAnswered}
							onclick={() => handleOptionClick(index)}
						>
							<span class="mr-3 font-semibold text-muted-foreground">
								{String.fromCharCode(65 + index)}.
							</span>
							<span>{option}</span>
						</Button>
					{/each}
				</div>

				{#if isAnswered && selectedOptionIndex !== currentQuestion.correctIndex && currentQuestion.explanation}
					<div
						data-testid="quiz-explanation"
						class="mt-6 rounded-md bg-amber-50 border border-amber-200 p-4"
					>
						<h4 class="mb-2 text-sm font-semibold text-amber-800">
							Explanation:
						</h4>
						<p class="text-sm text-amber-900">
							{currentQuestion.explanation}
						</p>
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-center gap-4" role="toolbar" aria-label="Quiz navigation">
				<Button
					data-testid="prev-button"
					variant="outline"
					size="icon"
					onclick={prevQuestion}
					disabled={!hasPrev}
					aria-label="Previous question"
				>
					<ChevronLeft class="size-5" />
				</Button>

				{#if isAnswered || !hasNext}
					<Button
						data-testid="next-button"
						variant="default"
						onclick={() => {
							if (!hasNext) {
								finishQuiz();
							} else {
								nextQuestion();
							}
						}}
						aria-label={hasNext ? "Next question" : "Finish quiz"}
					>
						{hasNext ? "Next" : "Finish"}
					</Button>
				{/if}
			</div>

			{#if !isAnswered}
				<div class="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
					<span class="flex items-center gap-1">
						<kbd class="rounded border px-1.5 py-0.5 font-mono">1</kbd>
						<kbd class="rounded border px-1.5 py-0.5 font-mono">2</kbd>
						<kbd class="rounded border px-1.5 py-0.5 font-mono">3</kbd>
						<kbd class="rounded border px-1.5 py-0.5 font-mono">4</kbd>
						to select
					</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
