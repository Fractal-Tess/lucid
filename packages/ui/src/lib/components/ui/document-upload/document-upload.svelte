<script lang="ts" module>
	import { cn } from "@lib/utils.js";

	export type UploadStatus = "pending" | "uploading" | "success" | "error";

	export interface UploadFile {
		id: string;
		file: File;
		status: UploadStatus;
		progress: number;
		error?: string;
	}

	function formatBytes(bytes: number, decimals = 2) {
		if (!+bytes) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
	}
</script>

<script lang="ts">
	import { Upload, File as FileIcon, FileText, X, AlertCircle, CheckCircle, Loader2 } from "lucide-svelte";
	import { Progress } from "@lib/components/ui/progress/index.js";
	import { Button } from "@lib/components/ui/button/index.js";
	
	let {
		accept = ".pdf,.doc,.docx",
		maxSize = 20 * 1024 * 1024,
		multiple = true,
		files = $bindable([]),
		class: className,
		onFilesSelected,
		disabled = false,
		...restProps
	}: {
		accept?: string;
		maxSize?: number;
		multiple?: boolean;
		files?: UploadFile[];
		class?: string;
		onFilesSelected?: (files: File[]) => void;
		disabled?: boolean;
	} = $props();

	let isDragging = $state(false);
	let fileInput = $state<HTMLInputElement>();

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (!disabled) isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = false;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (!disabled) isDragging = true;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = false;
		
		if (disabled) return;

		const droppedFiles = Array.from(e.dataTransfer?.files || []);
		handleFiles(droppedFiles);
	}

	function handleFileInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const selectedFiles = Array.from(target.files || []);
		handleFiles(selectedFiles);
		// Reset input value to allow selecting the same file again
		target.value = '';
	}

	function validateFile(file: File): { valid: boolean; error?: string } {
		// Validate size
		if (file.size > maxSize) {
			return { valid: false, error: `File size exceeds ${formatBytes(maxSize)}` };
		}

		// Validate type (basic check based on accept prop)
		// This is a simple check, usually explicit MIME types are better
		if (accept && accept !== '*') {
			const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());
			const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
			const fileType = file.type.toLowerCase();
			
			const isValid = acceptedTypes.some(type => {
				if (type.startsWith('.')) return type === fileExtension;
				if (type.endsWith('/*')) return fileType.startsWith(type.replace('/*', ''));
				return fileType === type;
			});

			if (!isValid) {
				return { valid: false, error: 'File type not accepted' };
			}
		}

		return { valid: true };
	}

	function handleFiles(newFiles: File[]) {
		if (!newFiles.length) return;

		if (!multiple && (files.length > 0 || newFiles.length > 1)) {
			// If not multiple, replace existing or take first
			files = [];
			newFiles = [newFiles[0]];
		}

		const processedFiles: UploadFile[] = newFiles.map(file => {
			const validation = validateFile(file);
			return {
				id: Math.random().toString(36).substring(2, 15),
				file,
				status: validation.valid ? 'pending' : 'error',
				progress: 0,
				error: validation.error
			};
		});

		files = [...files, ...processedFiles];
		onFilesSelected?.(processedFiles.filter(f => f.status !== 'error').map(f => f.file));
	}

	function removeFile(id: string) {
		files = files.filter(f => f.id !== id);
	}

	function getFileIcon(file: File) {
		if (file.type.includes('pdf')) return FileText;
		if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) return FileText;
		return FileIcon;
	}
</script>

<div class={cn("w-full space-y-4", className)} {...restProps}>
	<div
		role="button"
		tabindex="0"
		aria-label="Drop files here or click to upload"
		class={cn(
			"relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
			isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-accent/50",
			disabled ? "opacity-50 cursor-not-allowed hover:bg-transparent" : "cursor-pointer"
		)}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				if (!disabled) fileInput?.click();
			}
		}}
		onclick={() => {
			if (!disabled) fileInput?.click();
		}}
		ondragenter={handleDragEnter}
		ondragleave={handleDragLeave}
		ondragover={handleDragOver}
		ondrop={handleDrop}
	>
		<input
			bind:this={fileInput}
			type="file"
			class="hidden"
			{accept}
			{multiple}
			onchange={handleFileInput}
			{disabled}
		/>
		
		<div class="flex flex-col items-center gap-2 text-center">
			<div class="rounded-full bg-background p-3 shadow-sm ring-1 ring-border">
				<Upload class="size-6 text-muted-foreground" />
			</div>
			<div class="flex flex-col gap-1">
				<p class="text-sm font-medium text-foreground">
					<span class="text-primary">Click to upload</span> or drag and drop
				</p>
				<p class="text-xs text-muted-foreground">
					{accept.replace(/\./g, '').toUpperCase()} (Max {formatBytes(maxSize)})
				</p>
			</div>
		</div>
	</div>

	{#if files.length > 0}
		<div class="flex flex-col gap-2">
			{#each files as file (file.id)}
				{@const Icon = getFileIcon(file.file)}
				<div
					class={cn(
						"group relative flex items-center gap-3 rounded-lg border bg-background p-3 transition-colors",
						file.status === 'error' && "border-destructive/50 bg-destructive/5"
					)}
				>
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/50">
						<Icon class="size-5 text-muted-foreground" />
					</div>

					<div class="flex flex-1 flex-col gap-1 min-w-0">
						<div class="flex items-center justify-between gap-2">
							<p class="truncate text-sm font-medium text-foreground" title={file.file.name}>
								{file.file.name}
							</p>
							{#if file.status !== 'error'}
								<p class="shrink-0 text-xs text-muted-foreground">
									{formatBytes(file.file.size)}
								</p>
							{/if}
						</div>
						
						{#if file.status === 'uploading'}
							<div class="flex items-center gap-2">
								<Progress value={file.progress} class="h-1.5" />
								<span class="text-xs text-muted-foreground w-8 text-right">{Math.round(file.progress)}%</span>
							</div>
						{:else if file.status === 'error'}
							<p class="text-xs font-medium text-destructive">{file.error}</p>
						{:else if file.status === 'success'}
							<div class="flex items-center gap-1.5 text-xs text-primary font-medium">
								<CheckCircle class="size-3.5" />
								<span>Completed</span>
							</div>
						{:else}
							<p class="text-xs text-muted-foreground">Ready to upload</p>
						{/if}
					</div>

					<div class="flex items-center gap-2 pl-2">
						{#if file.status === 'uploading'}
							<Loader2 class="size-4 animate-spin text-muted-foreground" />
						{:else}
							<Button
								variant="ghost"
								size="icon"
								class="size-8 text-muted-foreground hover:text-foreground group-hover:opacity-100 lg:opacity-0 transition-opacity"
								onclick={(e) => {
									e.stopPropagation();
									removeFile(file.id);
								}}
								{disabled}
							>
								<X class="size-4" />
								<span class="sr-only">Remove file</span>
							</Button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
