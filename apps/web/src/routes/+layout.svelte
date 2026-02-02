<script lang="ts">
    import "../app.css";
    import { createSvelteAuthClient } from "@mmailaender/convex-better-auth-svelte/svelte";
    import { authClient } from "$lib/auth-client";

    const { children, data } = $props();
    createSvelteAuthClient({
        authClient,
        getServerState: () => data.authState,
    });
</script>

<div class="h-svh">
    {@render children()}
</div>
