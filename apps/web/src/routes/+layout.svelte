<script lang="ts">
    import "../app.css";
    import { createSvelteAuthClient } from "@mmailaender/convex-better-auth-svelte/svelte";
    import { authClient } from "$lib/auth-client";

    const { children } = $props();
    createSvelteAuthClient({ authClient });
</script>

<div class="h-svh">
    {@render children()}
</div>
