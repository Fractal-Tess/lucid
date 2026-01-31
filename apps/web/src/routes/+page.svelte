<script lang="ts">
    import { DarkVeil } from "@alpha/ui";
    import { Button } from "@alpha/ui/shadcn/button";
    import { Logo } from "@alpha/ui";
</script>

<DarkVeil
    class="fixed inset-0 -z-50"
    hueShift={0}
    noiseIntensity={0}
    scanlineIntensity={0}
    speed={0.5}
    scanlineFrequency={0}
    warpAmount={0}
    resolutionScale={1}
/>

<div class="flex min-h-screen items-center justify-center px-6">
    <div class="flex max-w-3xl flex-col items-center text-center">
        <div class="mb-8 flex flex-col items-center">
            <Logo variant="light" class="mb-4 h-24 w-auto" />
            <span class="text-4xl font-bold tracking-wide text-white"
                >Alpha</span
            >
        </div>

        <h1
            class="mb-4 text-5xl font-bold leading-tight text-white md:text-6xl"
        >
            Master Your Studies with AI-Powered Learning Tools
        </h1>

        <p class="mb-10 max-w-2xl text-lg text-white/70">
            Upload your materials, chat with AI, generate flashcards, quizzes,
            and more.
        </p>

        <Button
            size="lg"
            href="/auth"
            class="rounded-full bg-white px-8 py-6 text-base font-semibold text-[#0a0a0a] transition-all duration-300 hover:scale-105 hover:shadow-[0_10px_40px_rgba(255,255,255,0.2)]"
        >
            Get Started
        </Button>
    </div>
</div>
