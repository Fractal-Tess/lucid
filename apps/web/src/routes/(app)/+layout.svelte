<script lang="ts">
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import * as Breadcrumb from "@alpha/ui/shadcn/breadcrumb";
	import { Separator } from "@alpha/ui/shadcn/separator";
	import * as Sidebar from "@alpha/ui/shadcn/sidebar";
	import { useConvexClient } from "convex-svelte";
	import { api } from "@alpha/backend/convex/_generated/api";

	const { children } = $props();
	const client = useConvexClient();

	$effect(() => {
		// Store user in Convex DB if not exists (sync with Better Auth)
		// This is a fire-and-forget operation
		client.mutation(api.functions.users.store, {}).catch(console.error);
	});
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
							<Breadcrumb.Link href="/dashboard">Alpha</Breadcrumb.Link>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</header>
			{@render children()}
		</Sidebar.Inset>
	</Sidebar.Provider>
</div>
