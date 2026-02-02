<script lang="ts">
  import { DarkVeil } from '@alpha/ui';
  import { Button } from '@alpha/ui/shadcn/button';
  import { Logo } from '@alpha/ui';
  import { MotionFade, MotionSlide, MotionPop } from '@alpha/ui/animations';

  // Predefined delay values for staggered animation (must be literals for TypeScript)
  const wordDelays: Array<
    | 100
    | 200
    | 300
    | 400
    | 500
    | 600
    | 700
    | 800
    | 900
    | 1000
    | 1100
    | 1200
    | 1300
    | 1400
    | 1500
    | 1600
    | 1700
    | 1800
    | 1900
    | 2000
  > = [300, 400, 500, 600, 700, 800, 900];
</script>

<DarkVeil
  class="fixed inset-0 -z-50"
  hueShift={0}
  noiseIntensity={0}
  scanlineIntensity={0}
  speed={1}
  scanlineFrequency={0}
  warpAmount={0}
  resolutionScale={1}
/>

<div class="flex min-h-screen items-center justify-center px-6 py-20">
  <div class="flex max-w-4xl flex-col items-center text-center">
    <!-- Logo Section -->
    <div class="mb-6 flex flex-col items-center">
      <MotionPop delay={0}>
        <div class="relative">
          <Logo
            variant="light"
            class="relative mb-4 h-28 w-auto drop-shadow-2xl"
          />
        </div>
      </MotionPop>

      <MotionSlide direction="down" delay={100}>
        <span
          class="text-5xl font-bold tracking-wider text-white drop-shadow-lg"
        >
          Alpha
        </span>
      </MotionSlide>
    </div>

    <!-- Tagline -->
    <MotionFade delay={200}>
      <p class="mb-6 text-xl text-white/80 font-medium tracking-wide">
        Your AI-Powered Study Companion
      </p>
    </MotionFade>

    <!-- CTA Button -->
    <MotionPop delay={1800}>
      <div class="relative group">
        <!-- Button glow -->
        <div
          class="absolute inset-0 bg-white rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"
        ></div>

        <Button
          size="lg"
          href="/auth"
          class="relative rounded-full bg-white px-10 py-7 text-lg font-semibold text-[#0a0a0a]
                           transition-all duration-300 hover:scale-105
                           hover:shadow-[0_10px_50px_rgba(255,255,255,0.3)]
                           active:scale-95"
        >
          Get Started Free
        </Button>
      </div>
    </MotionPop>

    <!-- Trust indicator -->
    <MotionFade delay={2000}>
      <p class="mt-6 text-sm text-white/50">No credit card required</p>
    </MotionFade>
  </div>
</div>
