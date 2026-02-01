<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '@alpha/backend/convex/_generated/api';
	import type { Id } from '@alpha/backend/convex/_generated/dataModel';
	import { Button } from '@alpha/ui/shadcn/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@alpha/ui/shadcn/card';
	import { Input } from '@alpha/ui/shadcn/input';
	import { Label } from '@alpha/ui/shadcn/label';
	import { Progress } from '@alpha/ui/shadcn/progress';
	import { Upload, File as FileIcon, X, ArrowLeft } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	const subjectIdParam = $derived($page.url.searchParams.get('subject') || '');
	
	const convex = useConvexClient();
	const currentUser = useQuery(api.functions.users.getCurrentUser);
	const subjects = useQuery(api.functions.subjects.list);

	let selectedFile = $state<File | null>(null);
	let selectedSubjectId = $state(subjectIdParam);
	let isUploading = $state(false);
	let uploadProgress = $state(0);
	let error = $state('');

	const MAX_FILE_SIZE = 20 * 1024 * 1024;
	const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			if (file.size > MAX_FILE_SIZE) {
				error = 'File size must be less than 20MB';
				return;
			}
			if (!ALLOWED_TYPES.includes(file.type)) {
				error = 'Only PDF, DOC, and DOCX files are allowed';
				return;
			}
			error = '';
			selectedFile = file;
		}
	}

	function clearFile() {
		selectedFile = null;
		error = '';
	}

	async function handleUpload() {
		if (!selectedFile || !selectedSubjectId) return;
		
		isUploading = true;
		uploadProgress = 0;
		
		try {
			const uploadUrl = await convex.mutation(api.functions.documents.generateUploadUrl, {});
			
			const xhr = new XMLHttpRequest();
			
			xhr.upload.onprogress = (e) => {
				if (e.lengthComputable) {
					uploadProgress = Math.round((e.loaded / e.total) * 100);
				}
			};
			
			xhr.onload = async () => {
				if (xhr.status === 200) {
					const { storageId } = JSON.parse(xhr.responseText);
					
					if (selectedFile && currentUser.data?._id) {
						await convex.mutation(api.functions.documents.create, {
							userId: currentUser.data._id,
							subjectId: selectedSubjectId as Id<'subjects'>,
							name: selectedFile.name,
							storageId,
							mimeType: selectedFile.type,
							size: selectedFile.size
						});
					}
					
					goto(`/subjects/${selectedSubjectId}`);
				} else {
					error = 'Upload failed. Please try again.';
					isUploading = false;
				}
			};
			
			xhr.onerror = () => {
				error = 'Upload failed. Please try again.';
				isUploading = false;
			};
			
			xhr.open('POST', uploadUrl);
			if (selectedFile) {
				xhr.send(selectedFile);
			}
		} catch (err) {
			error = 'Upload failed. Please try again.';
			isUploading = false;
		}
	}
</script>

<div class="container mx-auto p-6 max-w-2xl">
	<Button variant="ghost" class="mb-4" href={selectedSubjectId ? `/subjects/${selectedSubjectId}` : '/subjects'}>
		<ArrowLeft class="size-4 mr-2" />
		Back
	</Button>

	<Card>
		<CardHeader>
			<CardTitle>Upload Document</CardTitle>
			<CardDescription>Upload PDF, DOC, or DOCX files up to 20MB</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			<div class="space-y-2">
				<Label for="subject">Subject</Label>
				<select 
					id="subject" 
					bind:value={selectedSubjectId}
					class="w-full rounded-md border border-input bg-background px-3 py-2"
					disabled={isUploading}
				>
					<option value="">Select a subject</option>
					{#if subjects.data}
						{#each subjects.data as subject}
							<option value={subject._id}>{subject.name}</option>
						{/each}
					{/if}
				</select>
			</div>

			{#if !selectedFile}
				<label 
					class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
					onkeydown={(e) => e.key === 'Enter' && document.getElementById('file-upload')?.click()}
					tabindex="0"
					role="button"
					aria-label="Upload file"
				>
					<div class="flex flex-col items-center justify-center pt-5 pb-6">
						<Upload class="size-12 text-muted-foreground mb-4" />
						<p class="mb-2 text-sm text-muted-foreground">
							<span class="font-semibold">Click to upload</span> or drag and drop
						</p>
						<p class="text-xs text-muted-foreground">PDF, DOC, DOCX up to 20MB</p>
					</div>
					<input 
						id="file-upload" 
						type="file" 
						class="hidden" 
						accept=".pdf,.doc,.docx"
						onchange={handleFileSelect}
						disabled={isUploading}
					/>
				</label>
			{:else}
				<div class="border rounded-lg p-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<FileIcon class="size-8 text-muted-foreground" />
							<div>
								<p class="font-medium">{selectedFile.name}</p>
								<p class="text-sm text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
							</div>
						</div>
						<Button variant="ghost" size="icon" onclick={clearFile} disabled={isUploading}>
							<X class="size-4" />
						</Button>
					</div>
					
					{#if isUploading}
						<div class="mt-4 space-y-2">
							<Progress value={uploadProgress} />
							<p class="text-sm text-muted-foreground text-center">{uploadProgress}% uploaded</p>
						</div>
					{/if}
				</div>
			{/if}

			{#if error}
				<p class="text-sm text-red-500">{error}</p>
			{/if}

			<Button 
				class="w-full" 
				disabled={!selectedFile || !selectedSubjectId || isUploading}
				onclick={handleUpload}
			>
				{isUploading ? 'Uploading...' : 'Upload Document'}
			</Button>
		</CardContent>
	</Card>
</div>
