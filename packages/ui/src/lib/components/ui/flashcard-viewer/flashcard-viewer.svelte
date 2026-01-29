<script lang="ts">
	import type { Flashcard, CardRating, RatingButton } from "./types.js";
	import { RotateCw, ChevronLeft, ChevronRight } from "@lucide/svelte";
	import { Button } from "@lib/components/ui/button/index.js";
	import { DEFAULT_RATING_BUTTONS } from "./types.js";
	import { cn } from "@lib/utils.js";

	let {
		cards = [],
		width = 600,
		height = 350,
		onRating,
		onNavigate,
		ratingButtons = DEFAULT_RATING_BUTTONS,
		class: className,
		...restProps
	}: {
		cards: Flashcard[];
		width?: number;
		height?: number;
		onRating?: (cardId: string, quality: CardRating) => void;
		onNavigate?: (index: number) => void;
		ratingButtons?: RatingButton[];
		class?: string;
	} = $props();

	// State
	let currentIndex = $state(0);
	let isFlipped = $state(false);
	let isFlipping = $state(false);

	// Derived state
	let currentCard = $derived(cards[currentIndex] ?? null);
	let hasPrev = $derived(currentIndex > 0);
	let hasNext = $derived(currentIndex < cards.length - 1);

	// Keyboard shortcuts
	function handleKeydown(e: KeyboardEvent) {
		if (e.repeat) return;

		switch (e.key) {
			case " ":
			case "Spacebar":
				e.preventDefault();
				flipCard();
				break;
			case "ArrowRight":
				e.preventDefault();
				nextCard();
				break;
			case "ArrowLeft":
				e.preventDefault();
				prevCard();
				break;
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
				if (isFlipped && currentCard) {
					e.preventDefault();
					const rating = parseInt(e.key) as CardRating;
					rateCard(rating);
				}
				break;
		}
	}

	function flipCard() {
		if (isFlipping) return;
		isFlipping = true;
		isFlipped = !isFlipped;

		// Reset animation lock after transition
		setTimeout(() => {
			isFlipping = false;
		}, 300);
	}

	function nextCard() {
		if (!hasNext) return;
		currentIndex++;
		isFlipped = false;
		onNavigate?.(currentIndex);
	}

	function prevCard() {
		if (!hasPrev) return;
		currentIndex--;
		isFlipped = false;
		onNavigate?.(currentIndex);
	}

	function rateCard(quality: CardRating) {
		if (!currentCard) return;
		onRating?.(currentCard.id, quality);

		// Auto-advance to next card after rating
		if (hasNext) {
			nextCard();
		}
	}

	function handleClick() {
		flipCard();
	}
</script>

<div class={cn("flex flex-col items-center gap-6", className)} {...restProps}>
	{#if cards.length === 0}
		<!-- Empty State -->
		<div
			data-testid="empty-state"
			class="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center"
			style="width: {width}px; height: {height}px;"
		>
			<p class="text-muted-foreground">No flashcards to review</p>
		</div>
	{:else}
		<!-- Card Counter -->
		<div data-testid="card-counter" class="text-sm font-medium text-muted-foreground">
			{currentIndex + 1} / {cards.length}
		</div>

		<!-- Flashcard -->
		<div
			data-testid="flashcard"
			tabindex="0"
			role="button"
			aria-label="Flashcard. Press Space to flip, Arrow keys to navigate."
			class="relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			style="width: {width}px; height: {height}px; perspective: 1000px;"
			onclick={handleClick}
			onkeydown={handleKeydown}
		>
			<div
				class={cn(
					"relative h-full w-full transition-transform duration-300 transform-style-3d",
					isFlipped && "rotate-y-180"
				)}
			>
				<!-- Front of Card (Question) -->
				<div
					data-testid="flashcard-front"
					class={cn(
						"absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 bg-card p-8 text-center shadow-lg backface-hidden",
						isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
					)}
				>
					<p class="text-2xl font-semibold text-card-foreground">{currentCard?.question}</p>
				</div>

				<!-- Back of Card (Answer) -->
				<div
					data-testid="flashcard-back"
					class={cn(
						"absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 border-primary bg-primary/5 p-8 text-center shadow-lg backface-hidden rotate-y-180",
						isFlipped ? "opacity-100" : "pointer-events-none opacity-0"
					)}
				>
					<p class="text-2xl font-semibold text-foreground">{currentCard?.answer}</p>
				</div>
			</div>
		</div>

		<!-- Rating Buttons (shown after flipping) -->
		{#if isFlipped}
			<div data-testid="rating-buttons" class="flex items-center gap-2">
				{#each ratingButtons as button}
					<Button
						data-testid="rating-button-{button.value}"
						variant="outline"
						size="sm"
						class="flex flex-col gap-1 h-auto py-2 px-3"
						onclick={(e) => {
							e.stopPropagation();
							rateCard(button.value);
						}}
					>
						<span class="text-xs font-medium">{button.label}</span>
					</Button>
				{/each}
			</div>
		{/if}

		<!-- Navigation Buttons -->
		<div class="flex items-center gap-4">
			<Button
				data-testid="prev-button"
				variant="outline"
				size="icon"
				onclick={prevCard}
				disabled={!hasPrev}
				aria-label="Previous card"
			>
				<ChevronLeft class="size-5" />
			</Button>

			<Button
				variant="ghost"
				size="icon"
				onclick={flipCard}
				aria-label="Flip card"
				title="Flip card (Space)"
			>
				<RotateCw class="size-5" />
			</Button>

			<Button
				data-testid="next-button"
				variant="outline"
				size="icon"
				onclick={nextCard}
				disabled={!hasNext}
				aria-label="Next card"
			>
				<ChevronRight class="size-5" />
			</Button>
		</div>

		<!-- Keyboard hints -->
		<div class="flex items-center gap-4 text-xs text-muted-foreground">
			<span class="flex items-center gap-1">
				<kbd class="rounded border px-1.5 py-0.5 font-mono">Space</kbd>
				<kbd class="rounded border px-1.5 py-0.5 font-mono">Click</kbd>
				to flip
			</span>
			<span class="flex items-center gap-1">
				<kbd class="rounded border px-1.5 py-0.5 font-mono">←</kbd>
				<kbd class="rounded border px-1.5 py-0.5 font-mono">→</kbd>
				to navigate
			</span>
			<span class="flex items-center gap-1">
				<kbd class="rounded border px-1.5 py-0.5 font-mono">1-5</kbd>
				to rate
			</span>
		</div>
	{/if}
</div>

<style>
	.transform-style-3d {
		transform-style: preserve-3d;
	}

	.backface-hidden {
		backface-visibility: hidden;
	}

	.rotate-y-180 {
		transform: rotateY(180deg);
	}
</style>
