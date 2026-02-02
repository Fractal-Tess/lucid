<script lang="ts" module>
    import { cn, type WithElementRef } from "@lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";
    import { type VariantProps, tv } from "tailwind-variants";

    export const motionFadeVariants = tv({
        base: "motion-preset-fade",
        variants: {
            duration: {
                100: "motion-duration-[100]",
                200: "motion-duration-[200]",
                300: "motion-duration-[300]",
                400: "motion-duration-[400]",
                500: "motion-duration-[500]",
                600: "motion-duration-[600]",
                700: "motion-duration-[700]",
                800: "motion-duration-[800]",
                900: "motion-duration-[900]",
                1000: "motion-duration-[1000]",
                1100: "motion-duration-[1100]",
                1200: "motion-duration-[1200]",
                1300: "motion-duration-[1300]",
                1400: "motion-duration-[1400]",
                1500: "motion-duration-[1500]",
                1600: "motion-duration-[1600]",
                1700: "motion-duration-[1700]",
                1800: "motion-duration-[1800]",
                1900: "motion-duration-[1900]",
                2000: "motion-duration-[2000]",
            },
            delay: {
                0: "",
                100: "motion-delay-[100]",
                200: "motion-delay-[200]",
                300: "motion-delay-[300]",
                400: "motion-delay-[400]",
                500: "motion-delay-[500]",
                600: "motion-delay-[600]",
                700: "motion-delay-[700]",
                800: "motion-delay-[800]",
                900: "motion-delay-[900]",
                1000: "motion-delay-[1000]",
                1100: "motion-delay-[1100]",
                1200: "motion-delay-[1200]",
                1300: "motion-delay-[1300]",
                1400: "motion-delay-[1400]",
                1500: "motion-delay-[1500]",
                1600: "motion-delay-[1600]",
                1700: "motion-delay-[1700]",
                1800: "motion-delay-[1800]",
                1900: "motion-delay-[1900]",
                2000: "motion-delay-[2000]",
            },
        },
        defaultVariants: {
            duration: 500,
            delay: 0,
        },
    });

    export type MotionFadeDuration = VariantProps<
        typeof motionFadeVariants
    >["duration"];
    export type MotionFadeDelay = VariantProps<
        typeof motionFadeVariants
    >["delay"];

    export type MotionFadeProps = WithElementRef<
        HTMLAttributes<HTMLDivElement>
    > & {
        duration?: MotionFadeDuration;
        delay?: MotionFadeDelay;
    };
</script>

<script lang="ts">
    let {
        ref = $bindable(null),
        class: className,
        children,
        duration = 500,
        delay = 0,
        ...restProps
    }: MotionFadeProps = $props();
</script>

<div
    bind:this={ref}
    class={cn(motionFadeVariants({ duration, delay }), className)}
    {...restProps}
>
    {@render children?.()}
</div>
