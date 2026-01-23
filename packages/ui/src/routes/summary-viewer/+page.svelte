<script lang="ts">
	import { page } from "$app/stores";
	import SummaryViewer from "@lib/components/ui/summary-viewer/summary-viewer.svelte";
	import type { SummaryData } from "@lib/components/ui/summary-viewer/types.js";

	const sampleSummary: SummaryData = {
		content:
			"Photosynthesis is the process used by plants, algae and certain bacteria to harness energy from sunlight and turn it into chemical energy. This text covers the two main stages: light-dependent reactions and light-independent reactions (Calvin cycle).",
		sections: [
			{
				title: "Light-Dependent Reactions",
				content:
					"These reactions occur in the thylakoid membranes of the chloroplasts. Light energy is captured by chlorophyll and used to convert water into oxygen (released as a byproduct) and high-energy molecules (ATP and NADPH).",
			},
			{
				title: "Calvin Cycle",
				content:
					"Also known as the dark reactions, these occur in the stroma. The ATP and NADPH produced in the light-dependent reactions are used to convert carbon dioxide into glucose, a type of sugar the plant needs for growth.",
			},
			{
				title: "Ecological Impact",
				content:
					"Photosynthesis is crucial for life on Earth as it produces oxygen and forms the base of the food web. It also helps regulate atmospheric carbon dioxide levels.",
			},
		],
	};

	const params = $page.url.searchParams;
	const emptyParam = params.get("empty");

	let summary = $state<SummaryData | null>(emptyParam === "true" ? null : sampleSummary);

	$effect(() => {
		const url = $page.url;
		const newEmpty = url.searchParams.get("empty");

		if (newEmpty === "true") {
			summary = null;
		} else if (newEmpty !== "true" && !summary) {
			summary = sampleSummary;
		}
	});
</script>

<div class="flex min-h-screen flex-col items-center justify-start bg-background p-8">
	<div class="w-full max-w-3xl space-y-8">
		<div class="text-center">
			<h1 class="text-3xl font-bold">Summary Viewer Demo</h1>
			<p class="text-muted-foreground">Example of a section-based document summary</p>
		</div>

		<SummaryViewer {summary} />

		<div class="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
			<p class="mb-2 font-semibold">Test Controls:</p>
			<ul class="list-inside list-disc space-y-1">
				<li>
					<a href="?empty=false" class="underline hover:text-foreground">Show Summary</a>
				</li>
				<li>
					<a href="?empty=true" class="underline hover:text-foreground">Show Empty State</a>
				</li>
			</ul>
		</div>
	</div>
</div>
