<script lang="ts">
	import '../app.css';
    import Header from '../components/Header.svelte';
    import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '$lib/auth-client';

	const { children } = $props();
	createSvelteAuthClient({ authClient, convexUrl: PUBLIC_CONVEX_URL });
</script>

<div class="grid h-svh grid-rows-[auto_1fr]">
	<Header />
	<main class="overflow-y-auto">
		{@render children()}
	</main>
</div>
