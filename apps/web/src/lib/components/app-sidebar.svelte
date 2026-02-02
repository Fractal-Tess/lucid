<script lang="ts" module>
	import BookOpenIcon from "@lucide/svelte/icons/book-open";
	import BrainIcon from "@lucide/svelte/icons/brain";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import GraduationCapIcon from "@lucide/svelte/icons/graduation-cap";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import LibraryIcon from "@lucide/svelte/icons/library";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";

	// Navigation data for the sidebar
	export const sidebarData = {
		user: {
			name: "User",
			email: "user@example.com",
			avatar: "",
		},
		navMain: [
			{
				title: "Dashboard",
				url: "/dashboard",
				icon: LayoutDashboardIcon,
				isActive: true,
			},
			{
				title: "Subjects",
				url: "/subjects",
				icon: LibraryIcon,
				items: [
					{
						title: "All Subjects",
						url: "/subjects",
					},
					{
						title: "New Subject",
						url: "/subjects/new",
					},
				],
			},
			{
				title: "Study Materials",
				url: "/generations",
				icon: SparklesIcon,
				items: [
					{
						title: "All Generations",
						url: "/generations",
					},
					{
						title: "Flashcards",
						url: "/generations/new?type=flashcards",
					},
					{
						title: "Quizzes",
						url: "/generations/new?type=quiz",
					},
					{
						title: "Notes",
						url: "/generations/new?type=notes",
					},
					{
						title: "Summaries",
						url: "/generations/new?type=summary",
					},
				],
			},
			{
				title: "Documents",
				url: "/documents/upload",
				icon: FileTextIcon,
				items: [
					{
						title: "Upload",
						url: "/documents/upload",
					},
				],
			},
		],
		studyTools: [
			{
				name: "Flashcards",
				url: "/study/flashcards",
				icon: BrainIcon,
			},
			{
				name: "Quiz Mode",
				url: "/study/quiz",
				icon: BookOpenIcon,
			},
			{
				name: "Review",
				url: "/study/review",
				icon: GraduationCapIcon,
			},
		],
	};
</script>

<script lang="ts">
	import NavMain from "./nav-main.svelte";
	import NavStudyTools from "./nav-study-tools.svelte";
	import NavUser from "./nav-user.svelte";
	import * as Sidebar from "@alpha/ui/shadcn/sidebar";
	import Logo from "@alpha/ui/logo";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		collapsible = "icon",
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root {collapsible} {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href="/dashboard" {...props}>
							<div class="flex aspect-square size-8 items-center justify-center">
								<Logo variant="light" class="size-8" />
							</div>
							<div class="grid flex-1 text-start text-sm leading-tight">
								<span class="truncate font-medium">Alpha</span>
								<span class="truncate text-xs">Study App</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={sidebarData.navMain} />
		<NavStudyTools tools={sidebarData.studyTools} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
