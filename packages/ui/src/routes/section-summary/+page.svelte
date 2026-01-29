<script lang="ts">
  import { SectionSummary, type SummaryData } from "$lib/components/ui/section-summary";

  const mockSummary: SummaryData = {
    id: "gen-123",
    content: "This document provides a comprehensive overview of the SM-2 spaced repetition algorithm, detailing its history, core formulas, and implementation strategies. It explains how the algorithm calculates review intervals based on user performance ratings and how ease factors are adjusted over time.",
    sections: [
      {
        title: "Introduction to SM-2",
        content: "SuperMemo-2 (SM-2) is an algorithm developed by Piotr Wozniak in the late 1980s. It is designed to calculate optimal intervals for reviewing information to maximize retention. The algorithm is based on the principle that information should be reviewed just before it is forgotten."
      },
      {
        title: "The Algorithm Steps",
        content: "1. Update repetition count (n).\n2. Calculate the Ease Factor (EF) based on the user's quality rating (q).\n3. Calculate the Interval (I) in days.\n\nThe core formula for EF is: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)).\nIf EF' < 1.3, let EF' = 1.3."
      },
      {
        title: "Quality Ratings",
        content: "The user rates their recall on a scale of 0 to 5:\n5 - perfect response\n4 - correct response after hesitation\n3 - correct response recalled with serious difficulty\n2 - incorrect response; where the correct one seemed easy to recall\n1 - incorrect response; the correct one remembered\n0 - complete blackout."
      }
    ],
    createdAt: Date.now()
  };
</script>

<div class="container mx-auto py-10 max-w-3xl">
  <h1 class="text-3xl font-bold mb-8">Section Summary Demo</h1>
  <SectionSummary summary={mockSummary} />
</div>
