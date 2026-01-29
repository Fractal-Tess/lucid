<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { Button } from '@lucid/ui/shadcn/button';
	import { Input } from '@lucid/ui/shadcn/input';
	import { Label } from '@lucid/ui/shadcn/label';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@lucid/ui/shadcn/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lucid/ui/shadcn/tabs';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let name = $state('');
	let isLoading = $state(false);
	let error = $state('');

	async function handleSignIn(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = '';
		
		const result = await authClient.signIn.email({
			email,
			password,
		});
		
		isLoading = false;
		
		if (result.error) {
			error = result.error.message || 'Sign in failed';
		} else {
			goto('/dashboard');
		}
	}

	async function handleSignUp(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = '';
		
		const result = await authClient.signUp.email({
			email,
			password,
			name,
		});
		
		isLoading = false;
		
		if (result.error) {
			error = result.error.message || 'Sign up failed';
		} else {
			goto('/dashboard');
		}
	}
</script>

<div class="container flex h-screen w-screen flex-col items-center justify-center">
	<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
		<div class="flex flex-col space-y-2 text-center">
			<h1 class="text-2xl font-semibold tracking-tight">Welcome to Lucid</h1>
			<p class="text-sm text-muted-foreground">Your AI-powered study companion</p>
		</div>

		<Tabs value="signin" class="w-full">
			<TabsList class="grid w-full grid-cols-2">
				<TabsTrigger value="signin">Sign In</TabsTrigger>
				<TabsTrigger value="signup">Sign Up</TabsTrigger>
			</TabsList>

			<TabsContent value="signin">
				<Card>
					<CardHeader>
						<CardTitle>Sign In</CardTitle>
						<CardDescription>Enter your credentials to access your account</CardDescription>
					</CardHeader>
					<form onsubmit={handleSignIn}>
						<CardContent class="space-y-4">
							<div class="space-y-2">
								<Label for="email">Email</Label>
								<Input id="email" type="email" placeholder="name@example.com" bind:value={email} required />
							</div>
							<div class="space-y-2">
								<Label for="password">Password</Label>
								<Input id="password" type="password" bind:value={password} required />
							</div>
							{#if error}
								<p class="text-sm text-red-500">{error}</p>
							{/if}
						</CardContent>
						<CardFooter>
							<Button type="submit" class="w-full" disabled={isLoading}>
								{isLoading ? 'Signing in...' : 'Sign In'}
							</Button>
						</CardFooter>
					</form>
				</Card>
			</TabsContent>

			<TabsContent value="signup">
				<Card>
					<CardHeader>
						<CardTitle>Create Account</CardTitle>
						<CardDescription>Enter your details to create a new account</CardDescription>
					</CardHeader>
					<form onsubmit={handleSignUp}>
						<CardContent class="space-y-4">
							<div class="space-y-2">
								<Label for="name">Name</Label>
								<Input id="name" placeholder="John Doe" bind:value={name} required />
							</div>
							<div class="space-y-2">
								<Label for="signup-email">Email</Label>
								<Input id="signup-email" type="email" placeholder="name@example.com" bind:value={email} required />
							</div>
							<div class="space-y-2">
								<Label for="signup-password">Password</Label>
								<Input id="signup-password" type="password" bind:value={password} required minlength={8} />
							</div>
							{#if error}
								<p class="text-sm text-red-500">{error}</p>
							{/if}
						</CardContent>
						<CardFooter>
							<Button type="submit" class="w-full" disabled={isLoading}>
								{isLoading ? 'Creating account...' : 'Create Account'}
							</Button>
						</CardFooter>
					</form>
				</Card>
			</TabsContent>
		</Tabs>
	</div>
</div>
