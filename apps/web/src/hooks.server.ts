import type { Handle } from "@sveltejs/kit";
import { getToken } from "@mmailaender/convex-better-auth-svelte/sveltekit";
import { auth } from "$lib/auth.server";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.token = await getToken(() => auth, event.cookies);

  return resolve(event);
};
