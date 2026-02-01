<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '@alpha/backend/convex/_generated/api';
	import type { Id } from '@alpha/backend/convex/_generated/dataModel';
	import { Button } from '@alpha/ui/shadcn/button';
	import { Card, CardContent, CardHeader, CardTitle } from '@alpha/ui/shadcn/card';
	import { Input } from '@alpha/ui/shadcn/input';
	import { Label } from '@alpha/ui/shadcn/label';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@alpha/ui/shadcn/dialog';
	import { Folder, BookOpen, Plus, ChevronRight } from '@lucide/svelte';

	const convex = useConvexClient();
	const currentUser = useQuery(api.functions.users.getCurrentUser);
	const subjectGroups = useQuery(api.functions.subjectGroups.list);
	const subjects = useQuery(api.functions.subjects.list);

	let newGroupName = $state('');
	let newSubjectName = $state('');
	let selectedGroupId = $state<string | null>(null);
	let isCreatingGroup = $state(false);
	let isCreatingSubject = $state(false);

	async function handleCreateGroup() {
		if (!newGroupName.trim() || !currentUser.data?._id) return;
		isCreatingGroup = true;
		await convex.mutation(api.functions.subjectGroups.create, { 
			name: newGroupName.trim(),
			userId: currentUser.data._id
		});
		newGroupName = '';
		isCreatingGroup = false;
	}

	async function handleCreateSubject() {
		if (!newSubjectName.trim() || !currentUser.data?._id) return;
		isCreatingSubject = true;
		const groupId = selectedGroupId ? selectedGroupId as Id<'subjectGroups'> : undefined;
		await convex.mutation(api.functions.subjects.create, { 
			name: newSubjectName.trim(),
			userId: currentUser.data._id,
			groupId
		});
		newSubjectName = '';
		isCreatingSubject = false;
	}

	function getUngroupedSubjects(allSubjects: typeof subjects.data) {
		if (!allSubjects) return [];
		return allSubjects.filter(s => !s.groupId);
	}

	function getSubjectsForGroup(allSubjects: typeof subjects.data, groupId: string) {
		if (!allSubjects) return [];
		return allSubjects.filter(s => s.groupId === groupId);
	}
</script>

<div class="container mx-auto p-6">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold">Subjects</h1>
			<p class="text-muted-foreground mt-1">Organize your study materials</p>
		</div>
		<div class="flex gap-2">
			<Dialog>
				<DialogTrigger>
					<Button variant="outline">
						<Folder class="size-4 mr-2" />
						New Group
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Subject Group</DialogTitle>
					</DialogHeader>
					<div class="space-y-4 pt-4">
						<div class="space-y-2">
							<Label for="group-name">Group Name</Label>
							<Input id="group-name" placeholder="e.g., Fall 2024" bind:value={newGroupName} />
						</div>
						<Button onclick={handleCreateGroup} disabled={isCreatingGroup || !newGroupName.trim()} class="w-full">
							{isCreatingGroup ? 'Creating...' : 'Create Group'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog>
				<DialogTrigger>
					<Button>
						<BookOpen class="size-4 mr-2" />
						New Subject
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Subject</DialogTitle>
					</DialogHeader>
					<div class="space-y-4 pt-4">
						<div class="space-y-2">
							<Label for="subject-name">Subject Name</Label>
							<Input id="subject-name" placeholder="e.g., Calculus 101" bind:value={newSubjectName} />
						</div>
						<div class="space-y-2">
							<Label for="subject-group">Group (Optional)</Label>
							<select 
								id="subject-group" 
								bind:value={selectedGroupId}
								class="w-full rounded-md border border-input bg-background px-3 py-2"
							>
								<option value={null}>No Group</option>
								{#if subjectGroups.data}
									{#each subjectGroups.data as group}
										<option value={group._id}>{group.name}</option>
									{/each}
								{/if}
							</select>
						</div>
						<Button onclick={handleCreateSubject} disabled={isCreatingSubject || !newSubjectName.trim()} class="w-full">
							{isCreatingSubject ? 'Creating...' : 'Create Subject'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	</div>

	{#if subjectGroups.isLoading || subjects.isLoading}
		<div class="flex items-center justify-center py-12">
			<p class="text-muted-foreground">Loading...</p>
		</div>
	{:else}
		<div class="space-y-6">
			{#if subjectGroups.data}
				{#each subjectGroups.data as group}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<Folder class="size-5 text-muted-foreground" />
								{group.name}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{@const groupSubjects = getSubjectsForGroup(subjects.data, group._id)}
							{#if groupSubjects.length > 0}
								<div class="grid gap-2">
									{#each groupSubjects as subject}
										<Button 
											variant="ghost" 
											class="justify-between h-auto py-3 px-4"
											href="/subjects/{subject._id}"
										>
											<div class="flex items-center gap-3">
												<span class="text-2xl">{subject.icon || ''}</span>
												<span>{subject.name}</span>
											</div>
											<ChevronRight class="size-4 text-muted-foreground" />
										</Button>
									{/each}
								</div>
							{:else}
								<p class="text-muted-foreground text-sm">No subjects in this group yet</p>
							{/if}
						</CardContent>
					</Card>
				{/each}
			{/if}

			{#if subjects.data}
				{@const ungrouped = getUngroupedSubjects(subjects.data)}
				{#if ungrouped.length > 0}
					<Card>
						<CardHeader>
							<CardTitle>Ungrouped Subjects</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="grid gap-2">
								{#each ungrouped as subject}
									<Button 
										variant="ghost" 
										class="justify-between h-auto py-3 px-4"
										href="/subjects/{subject._id}"
									>
										<div class="flex items-center gap-3">
											<span class="text-2xl">{subject.icon || ''}</span>
											<span>{subject.name}</span>
										</div>
										<ChevronRight class="size-4 text-muted-foreground" />
									</Button>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}
			{/if}

			{#if (!subjectGroups.data || subjectGroups.data.length === 0) && (!subjects.data || getUngroupedSubjects(subjects.data).length === 0)}
				<div class="text-center py-12">
					<p class="text-muted-foreground mb-4">No subjects yet. Create your first subject or group to get started.</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
