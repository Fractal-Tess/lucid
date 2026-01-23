<script lang="ts">
	import type {
		QuizItem,
		QuizAnswer,
		QuizResults,
		QuizResultsSummaryProps,
		QuestionReview,
	} from "./types.js";
	import { Trophy, Clock, RotateCcw, Download, CheckCircle2, XCircle, ChevronDown } from "@lucide/svelte";
	import { Button } from "@lib/components/ui/button/index.js";
	import { cn } from "@lib/utils.js";
	import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@lib/components/ui/accordion/index.js";

	let {
		questions,
		results,
		duration,
		showQuestionReview = true,
		onRetakeQuiz,
		onReviewQuestion,
		onExportResults,
		class: className,
		...restProps
	}: QuizResultsSummaryProps = $props();

	let expandedQuestions = $state<Set<number>>(new Set());

	let percentage = $derived(
		results.total > 0 ? Math.round((results.score / results.total) * 100) : 0
	);

	let durationFormatted = $derived(
		duration
			? duration >= 60
				? `${Math.floor(duration / 60)}m ${duration % 60}s`
				: `${duration}s`
			: undefined
	);

	let getPerformanceColor = $derived(() => {
		if (percentage >= 80) return "text-green-600";
		if (percentage >= 60) return "text-amber-600";
		return "text-red-600";
	});

	let getPerformanceLabel = $derived(() => {
		if (percentage >= 90) return "Excellent!";
		if (percentage >= 80) return "Great job!";
		if (percentage >= 70) return "Good effort!";
		if (percentage >= 60) return "Keep practicing!";
		return "Keep studying!";
	});

	let allAnswers = $derived<QuizAnswer[]>([...results.correctAnswers, ...results.wrongAnswers]);

	function getQuestionWithAnswer(answer: QuizAnswer): QuestionReview | null {
		const question = questions.find((q) => q.id === answer.questionId);
		if (!question) return null;

		return {
			question,
			answer,
			showExplanation: !answer.isCorrect,
		};
	}

	function toggleQuestionExpand(index: number) {
		if (expandedQuestions.has(index)) {
			expandedQuestions.delete(index);
		} else {
			expandedQuestions.add(index);
		}
	}
</script>

<div
	class={cn("flex flex-col items-center gap-6", className)}
	{...restProps}
	role="region"
	aria-label="Quiz results summary"
>
	<div class="w-full max-w-4xl rounded-lg border bg-card p-8">
		<div class="flex flex-col items-center gap-6">
			<Trophy class="size-16 text-primary" />

			<h2 class="text-3xl font-bold">Quiz Complete!</h2>

			<div class="text-center">
				<p class="text-5xl font-bold {getPerformanceColor()}">
					{percentage}%
				</p>
				<p class="mt-2 text-lg text-muted-foreground">
					{getPerformanceLabel}
				</p>
			</div>

			<div class="flex gap-8 text-center">
				<div class="flex flex-col items-center">
					<span class="flex items-center gap-2 text-2xl font-semibold text-green-600">
						<CheckCircle2 class="size-6" />
						{results.correctAnswers.length}
					</span>
					<span class="text-sm text-muted-foreground">Correct</span>
				</div>

				<div class="flex flex-col items-center">
					<span class="flex items-center gap-2 text-2xl font-semibold text-red-600">
						<XCircle class="size-6" />
						{results.wrongAnswers.length}
					</span>
					<span class="text-sm text-muted-foreground">Incorrect</span>
				</div>

				{#if duration}
					<div class="flex flex-col items-center">
						<span class="flex items-center gap-2 text-2xl font-semibold">
							<Clock class="size-6" />
							{durationFormatted}
						</span>
						<span class="text-sm text-muted-foreground">Time</span>
					</div>
				{/if}
			</div>

			<div class="flex gap-3">
				{#if onRetakeQuiz}
					<Button onclick={onRetakeQuiz} variant="outline">
						<RotateCcw class="mr-2 size-4" />
						Retake Quiz
					</Button>
				{/if}

				{#if onExportResults}
					<Button onclick={onExportResults} variant="outline">
						<Download class="mr-2 size-4" />
						Export Results
					</Button>
				{/if}
			</div>
		</div>

		{#if showQuestionReview && allAnswers.length > 0}
			<div class="mt-8 border-t pt-8">
				<h3 class="mb-6 text-xl font-semibold">Question Review</h3>

				<div class="space-y-4">
					{#each allAnswers as answer, index}
						{@const review = getQuestionWithAnswer(answer)}

						{#if review}
							<div
								class="rounded-lg border bg-card p-4"
								data-testid="question-review-{index}"
							>
								<button
									class="flex w-full items-center justify-between text-left"
									onclick={() => toggleQuestionExpand(index)}
									aria-expanded={expandedQuestions.has(index)}
									aria-controls={`question-content-${index}`}
								>
									<div class="flex items-start gap-3">
										<span class="flex size-6 items-center justify-center rounded-full text-xs font-bold {review.answer.isCorrect
											? 'bg-green-100 text-green-700'
											: 'bg-red-100 text-red-700'}">
											{review.answer.isCorrect ? '✓' : '✗'}
										</span>

										<div class="flex-1">
											<p class="font-medium">{review.question.question}</p>

											<div class="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
												<span
													class={cn(
														"rounded px-2 py-1",
														review.answer.isCorrect
															? "bg-green-100 text-green-700"
															: "bg-red-100 text-red-700"
													)}
												>
													{review.answer.isCorrect ? 'Correct' : 'Incorrect'}
												</span>

												<span class="rounded bg-muted px-2 py-1">
													Selected: {review.question.options[review.answer.selectedIndex]}
												</span>

												{#if !review.answer.isCorrect}
													<span class="rounded bg-green-100 px-2 py-1 text-green-700">
														Correct: {review.question.options[review.question.correctIndex]}
													</span>
												{/if}
											</div>
										</div>
									</div>

									<ChevronDown
										class={cn(
											"size-5 transition-transform text-muted-foreground",
											expandedQuestions.has(index) && "rotate-180"
										)}
									/>
								</button>

								{#if expandedQuestions.has(index)}
									<div
										id="question-content-{index}"
										class="mt-4 space-y-3 pl-9"
									>
										<div class="space-y-2">
											{#each review.question.options as option, optIndex}
												<div
													class={cn(
														"rounded-md px-3 py-2 text-sm",
														optIndex === review.question.correctIndex
															? "bg-green-100 text-green-800 font-medium"
															: optIndex === review.answer.selectedIndex && !review.answer.isCorrect
															? "bg-red-100 text-red-800"
															: "bg-muted"
													)}
												>
													<span class="mr-2 font-semibold">
														{String.fromCharCode(65 + optIndex)}.
													</span>
													{option}
													{#if optIndex === review.question.correctIndex}
														<span class="ml-2 text-xs">(Correct answer)</span>
													{/if}
												</div>
											{/each}
										</div>

										{#if review.question.explanation}
											<div class="rounded-md bg-amber-50 border border-amber-200 p-3">
												<p class="mb-1 text-sm font-semibold text-amber-800">Explanation:</p>
												<p class="text-sm text-amber-900">{review.question.explanation}</p>
											</div>
										{/if}

										{#if onReviewQuestion}
											<Button
												variant="outline"
												size="sm"
												onclick={() => onReviewQuestion(review.question.id)}
											>
												Review this question
											</Button>
										{/if}
									</div>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
