<script lang="ts">
  import { NotesViewer, type NotesData } from "@lib/components/ui/notes-viewer";

  const mockNotes: NotesData = {
    id: "gen-123",
    content: "## Introduction to Photosynthesis\n\nPhotosynthesis is the process by which plants convert **light energy** into chemical energy. This process occurs primarily in the *chloroplasts* of plant cells.\n\n## Key Components\n\n- **Chlorophyll**: The pigment that absorbs light\n- **Carbon Dioxide**: Taken in through stomata\n- **Water**: Absorbed through roots\n- **Sunlight**: Provides the energy needed\n\n## The Equation\n\n6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
    keyPoints: [
      "Photosynthesis converts light energy into glucose",
      "Chlorophyll is the primary pigment involved",
      "The process releases oxygen as a byproduct",
      "It occurs in two stages: light-dependent reactions and Calvin cycle"
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
</script>

<div class="container mx-auto py-10 max-w-3xl">
  <h1 class="text-3xl font-bold mb-8">Notes Viewer Demo</h1>
  <NotesViewer notes={mockNotes} />
</div>
