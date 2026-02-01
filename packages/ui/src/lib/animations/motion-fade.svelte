<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@lib/utils.js";

	type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		duration?: number;
		delay?: number;
	};

	let {
		ref = $bindable(null),
		class: className,
		children,
		duration = 500,
		delay = 0,
		...restProps
	}: Props = $props();
</script>

<div
	bind:this={ref}
	class={cn(
		"motion-preset-fade",
		`motion-duration-${duration}`,
		delay > 0 && `motion-delay-${delay}`,
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
