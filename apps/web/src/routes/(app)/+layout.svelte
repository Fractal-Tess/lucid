<script lang="ts">
	import { createSvelteAuthClient } from "@mmailaender/convex-better-auth-svelte/svelte";
	import { authClient } from "$lib/auth-client";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import * as Breadcrumb from "@alpha/ui/shadcn/breadcrumb";
	import { Separator } from "@alpha/ui/shadcn/separator";
	import * as Sidebar from "@alpha/ui/shadcn/sidebar";

	const { children } = $props();
	createSvelteAuthClient({ authClient });
</script>

<div class="h-svh">
	<Sidebar.Provider>
		<AppSidebar />
		<Sidebar.Inset>
			<header
				class="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
			>
				<Sidebar.Trigger class="-ms-1" />
				<Separator orientation="vertical" class="me-2 h-4" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item class="hidden md:block">
							<Breadcrumb.Link href="/dashboard">Lucid</Breadcrumb.Link>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</header>
			{@render children()}
		</Sidebar.Inset>
	</Sidebar.Provider>
</div>
