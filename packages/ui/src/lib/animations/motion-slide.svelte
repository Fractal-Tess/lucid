<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@lib/utils.js";

	type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		direction?: "up" | "down" | "left" | "right";
		duration?: number;
		delay?: number;
	};

	let {
		ref = $bindable(null),
		class: className,
		children,
		direction = "up",
		duration = 500,
		delay = 0,
		...restProps
	}: Props = $props();

	const presetClass = $derived({
		up: "motion-preset-slide-up",
		down: "motion-preset-slide-down",
		left: "motion-preset-slide-left",
		right: "motion-preset-slide-right",
	}[direction]);
</script>

<div
	bind:this={ref}
	class={cn(
		presetClass,
		`motion-duration-${duration}`,
		delay > 0 && `motion-delay-${delay}`,
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
