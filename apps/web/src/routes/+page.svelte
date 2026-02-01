<script lang="ts">
    import { DarkVeil } from "@alpha/ui";
    import { Button } from "@alpha/ui/shadcn/button";
    import { Logo } from "@alpha/ui";
    import { MotionFade, MotionSlide, MotionPop } from "@alpha/ui/animations";

    // Split title into words
    const titleWords = [
        "Master",
        "Your",
        "Studies",
        "with",
        "AI-Powered",
        "Learning",
        "Tools",
    ];

    // Feature highlights with icons
    const features = [
        { icon: "📚", text: "Smart Flashcards" },
        { icon: "📝", text: "AI Quizzes" },
        { icon: "📄", text: "Auto Summaries" },
        { icon: "💬", text: "Chat with AI" },
    ];
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
                <span class="text-5xl font-bold tracking-wider text-white drop-shadow-lg">
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

        <!-- Main Title -->
        <div class="mb-6 overflow-hidden">
            <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                {#each titleWords as word, i}
                    <MotionSlide direction="up" delay={300 + i * 100} class="inline-block">
                        <span class="inline-block mr-3 md:mr-4 {word === 'AI-Powered' ? 'text-white/90 italic' : 'text-white'}">
                            {word}
                        </span>
                    </MotionSlide>
                {/each}
            </h1>
        </div>

        <!-- Description -->
        <MotionFade delay={1000}>
            <p class="max-w-2xl mb-10 text-lg md:text-xl text-white/70 leading-relaxed">
                Upload your study materials and let AI transform them into
                interactive flashcards, quizzes, and comprehensive
                summaries.
            </p>
        </MotionFade>

        <!-- Feature Highlights -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 w-full max-w-2xl">
            {#each features as feature, i}
                <MotionPop delay={1200 + i * 150}>
                    <div class="group">
                        <div class="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4
                               transition-all duration-300 hover:bg-white/10 hover:scale-105
                               hover:border-white/20">
                            <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <div class="text-sm text-white/80 font-medium">
                                {feature.text}
                            </div>
                        </div>
                    </div>
                </MotionPop>
            {/each}
        </div>

        <!-- CTA Button -->
        <MotionPop delay={1800}>
            <div class="relative group">
                <!-- Button glow -->
                <div class="absolute inset-0 bg-white rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500">
                </div>

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
            <p class="mt-6 text-sm text-white/50">
                No credit card required
            </p>
        </MotionFade>
    </div>
</div>
