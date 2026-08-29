import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AcceptInviteClient } from "@/components/team/AcceptInviteClient";

export default async function AcceptInvitePage({ params }: { params: { token: string } }) {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/accept-invite/${params.token}`);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AcceptInviteClient token={params.token} />
    </div>
  );
}