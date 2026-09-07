import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/shipments(.*)',
  '/documents(.*)',
  '/compliance(.*)',
  '/settings(.*)',
  '/onboarding(.*)',
  '/api/(.*)',
]);

const isPublicApiRoute = createRouteMatcher([
  '/api/team/accept(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req) && !isPublicApiRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/(api|trpc)(.*)',
  ],
};