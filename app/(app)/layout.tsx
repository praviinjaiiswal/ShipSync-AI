import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { getCurrentUser } from '@/lib/getCurrentUser';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await getCurrentUser();
  if (!user?.companyId || !user?.onboardingComplete) {
    redirect('/onboarding');
  }

  return <DashboardShell>{children}</DashboardShell>;
}