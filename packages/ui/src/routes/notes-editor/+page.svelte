<script lang="ts">
  import { NotesEditor, type EditableNotesData } from "@lib/components/ui/notes-editor";

  let mockNotes: EditableNotesData = $state({
    id: "gen-123",
    content: "## Introduction to Photosynthesis\n\nPhotosynthesis is the process by which plants convert **light energy** into chemical energy.",
    keyPoints: [
      "Photosynthesis converts light energy into glucose",
      "Chlorophyll is the primary pigment involved"
    ]
  });

  function handleUpdate(notes: { content: string; keyPoints: string[] }) {
    mockNotes = { ...mockNotes, ...notes };
  }

  function handleSave() {
    console.log("Saved:", mockNotes);
  }
</script>

<div class="container mx-auto py-10 max-w-3xl">
  <h1 class="text-3xl font-bold mb-8">Notes Editor Demo</h1>
  <NotesEditor 
    notes={mockNotes} 
    onUpdate={handleUpdate}
    onSave={handleSave}
  />
</div>
