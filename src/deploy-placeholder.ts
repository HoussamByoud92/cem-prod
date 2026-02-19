// This file exists only to satisfy the Vercel build command.
// We need 'vite build' to produce a 'dist' folder with static assets,
// but we DON'T want it to build the actual SSR app code into 'dist',
// because Vercel would serve that code statically effectively leaking it.
// The actual app logic is handled by 'api/index.ts' (Vercel Functions).
export default null;
