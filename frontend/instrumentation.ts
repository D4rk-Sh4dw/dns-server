// This file is used to initialize server-side code when the Next.js server starts
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { initBackgroundJobs } = await import('./lib/background-jobs');
        initBackgroundJobs();
    }
}
