"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";

export function AcceptInviteClient({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/team/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Invite accept nahi ho paaya");
        }
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setStatus("error");
      });
  }, [token, router]);

  return (
    <div className="text-center space-y-3 max-w-sm px-4">
      {status === "loading" && (
        <>
          <Loader className="justify-center" />
          <p className="text-sm text-muted-foreground">Invite accept ho raha hai...</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="text-foreground font-medium">Team join ho gayi! Dashboard pe le ja rahe hain...</p>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="w-10 h-10 text-destructive mx-auto" />
          <p className="text-destructive text-sm">{errorMsg}</p>
        </>
      )}
    </div>
  );
}