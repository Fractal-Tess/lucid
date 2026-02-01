<script lang="ts">
	import * as Sidebar from "@alpha/ui/shadcn/sidebar";

	let {
		tools,
	}: {
		tools: {
			name: string;
			url: string;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			icon: any;
		}[];
	} = $props();
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
	<Sidebar.GroupLabel>Study Tools</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each tools as tool (tool.name)}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton>
					{#snippet child({ props })}
						<a href={tool.url} {...props}>
							<tool.icon />
							<span>{tool.name}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
