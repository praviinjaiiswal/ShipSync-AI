"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Activity as ActivityIcon } from "lucide-react";

type ActivityItem = {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: { name: string | null; email: string };
};

const ACTION_LABELS: Record<string, string> = {
  SHIPMENT_CREATED: "created a shipment",
  SHIPMENT_UPDATED: "updated a shipment",
  SHIPMENT_DELETED: "deleted a shipment",
};

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((res) => res.json())
      .then(setActivities)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">Abhi tak koi activity nahi hui.</p>;
  }

  return (
    <ul className="space-y-3">
      {activities.map((a) => (
        <li key={a.id} className="flex items-start gap-3 text-sm">
          <ActivityIcon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-foreground">
              <span className="font-medium">{a.user.name ?? a.user.email}</span>{" "}
              {ACTION_LABELS[a.action] ?? a.action.replace(/_/g, " ").toLowerCase()}
              {a.details && <span className="text-muted-foreground"> — {a.details}</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}