<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { Button } from '@lucid/ui/shadcn/button';
	import { LogOut, User } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	const session = authClient.useSession();

	const links = [
		{ to: "/dashboard", label: "Dashboard" },
		{ to: "/subjects", label: "Subjects" },
		{ to: "/generations", label: "Generations" },
	];

	async function handleSignOut() {
		await authClient.signOut();
		goto('/auth');
	}
</script>

<div class="border-b">
	<div class="flex h-16 items-center px-4 md:px-6">
		<div class="flex items-center gap-6">
			<a href="/dashboard" class="flex items-center gap-2 font-bold text-xl">
				Lucid
			</a>
			<nav class="flex gap-4 text-sm font-medium">
				{#each links as link (link.to)}
					<a
						href={link.to}
						class="text-muted-foreground hover:text-foreground transition-colors"
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>
		<div class="ml-auto flex items-center gap-4">
			{#if $session.data?.user}
				<div class="flex items-center gap-2">
					<User class="size-4" />
					<span class="text-sm text-muted-foreground hidden md:inline">{$session.data.user.email}</span>
				</div>
				<Button variant="ghost" size="sm" onclick={handleSignOut}>
					<LogOut class="size-4 mr-2" />
					Sign Out
				</Button>
			{:else}
				<Button variant="ghost" size="sm" href="/auth">Sign In</Button>
			{/if}
		</div>
	</div>
</div>
