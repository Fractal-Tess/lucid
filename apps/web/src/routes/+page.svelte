<script lang="ts">
	import { Button } from '@lucid/ui/shadcn/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@lucid/ui/shadcn/card';
	import { Brain, FileText, Sparkles, BookOpen, ArrowRight } from '@lucide/svelte';

	const features = [
		{
			icon: FileText,
			title: 'Upload Documents',
			description: 'Upload PDFs, DOC, and DOCX files to study'
		},
		{
			icon: Sparkles,
			title: 'AI Summaries',
			description: 'Get instant summaries of your documents'
		},
		{
			icon: Brain,
			title: 'Flashcards',
			description: 'Auto-generated flashcards for effective studying'
		},
		{
			icon: BookOpen,
			title: 'Quizzes',
			description: 'Test your knowledge with AI-generated quizzes'
		}
	];
</script>

<div class="container mx-auto px-6 py-12">
	<div class="text-center max-w-3xl mx-auto mb-16">
		<h1 class="text-5xl font-bold mb-6">Study Smarter with AI</h1>
		<p class="text-xl text-muted-foreground mb-8">
			Lucid helps you learn faster by transforming your documents into 
			flashcards, quizzes, summaries, and notes using AI.
		</p>
		<div class="flex gap-4 justify-center">
			<Button size="lg" href="/auth">
				Get Started
				<ArrowRight class="size-4 ml-2" />
			</Button>
		</div>
	</div>

	<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
		{#each features as feature}
			<Card>
				<CardHeader>
					<feature.icon class="size-10 text-primary mb-2" />
					<CardTitle>{feature.title}</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-muted-foreground">{feature.description}</p>
				</CardContent>
			</Card>
		{/each}
	</div>

	<div class="text-center">
		<p class="text-muted-foreground">Ready to start learning?</p>
		<Button variant="link" href="/auth">Sign in or create an account →</Button>
	</div>
</div>
