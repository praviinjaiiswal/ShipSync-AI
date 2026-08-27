import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";

export async function getCurrentUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: { email, name: clerkUser.fullName ?? undefined },
    create: {
      clerkId: clerkUser.id,
      email,
      name: clerkUser.fullName ?? undefined,
    },
  });

  return user;
}