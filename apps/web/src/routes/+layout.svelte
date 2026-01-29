<script lang="ts">
	import '../app.css';
	import Header from '../components/Header.svelte';
	import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '$lib/auth-client';

	const { children } = $props();
	createSvelteAuthClient({ authClient: authClient as any });
</script>

<div class="grid h-svh grid-rows-[auto_1fr]">
	<Header />
	<main class="overflow-y-auto bg-background">
		{@render children()}
	</main>
</div>
