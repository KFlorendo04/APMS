import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "./supabase";

export type AppNotification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  target: string | null;
};

export function useNotifications() {
  const { user, demoMode } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setError(null);
      return;
    }
    if (demoMode) {
      setItems(demoNotifications());
      setError(null);
      return;
    }
    if (!supabase) {
      setItems([]);
      setError(null);
      return;
    }
    setLoading(true);
    const { data, error: requestError } = await supabase
      .from("notifications")
      .select("id,title,body,read_at,created_at,entity_type,entity_id")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (requestError) setError("Notifications could not be loaded.");
    else {
      setError(null);
      setItems(
        (data ?? []).map((item) => ({
          id: item.id,
          message: `${item.title}: ${item.body}`,
          read: Boolean(item.read_at),
          createdAt: item.created_at,
          target: notificationTarget(item.entity_type, item.entity_id),
        })),
      );
    }
    setLoading(false);
  }, [demoMode, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markRead = useCallback(
    async (id: string) => {
      if (!user) return;
      if (demoMode) {
        setItems((current) =>
          current.map((item) =>
            item.id === id ? { ...item, read: true } : item,
          ),
        );
        return;
      }
      if (!supabase) return;
      const { error: requestError } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .eq("recipient_id", user.id);
      if (requestError)
        throw new Error("The notification could not be marked as read.");
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, read: true } : item,
        ),
      );
    },
    [demoMode, user],
  );

  const markAllRead = useCallback(async () => {
    if (!user) return;
    if (demoMode) {
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      return;
    }
    if (!supabase) return;
    const { error: requestError } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", user.id)
      .is("read_at", null);
    if (requestError) throw new Error("Notifications could not be updated.");
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  }, [demoMode, user]);

  return {
    items,
    unread: items.filter((item) => !item.read).length,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
  };
}

function demoNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: "demo-1",
      message: "Grades Submitted: Midterm results are ready for review.",
      read: false,
      createdAt: new Date(now - 5 * 60_000).toISOString(),
      target: "grades",
    },
    {
      id: "demo-2",
      message: "New Feedback: Your performance assessment is available.",
      read: false,
      createdAt: new Date(now - 60 * 60_000).toISOString(),
      target: "feedback",
    },
    {
      id: "demo-3",
      message: "Upcoming Event: Faculty review meeting starts tomorrow.",
      read: false,
      createdAt: new Date(now - 3 * 60 * 60_000).toISOString(),
      target: "events",
    },
    {
      id: "demo-4",
      message: "Analytics report updated from fictional validation records.",
      read: true,
      createdAt: new Date(now - 5 * 60 * 60_000).toISOString(),
      target: "analytics",
    },
    {
      id: "demo-5",
      message: "System Update: APMS maintenance completed successfully.",
      read: true,
      createdAt: new Date(now - 24 * 60 * 60_000).toISOString(),
      target: null,
    },
  ];
}

function notificationTarget(
  entityType: string | null,
  entityId: string | null,
) {
  if (!entityType || !entityId) return null;
  const screens: Record<string, string> = {
    feedback_record: "feedback",
    assessment_result: "grades",
    event: "events",
    backup: "backup",
  };
  return screens[entityType]
    ? `${screens[entityType]}?record=${encodeURIComponent(entityId)}`
    : null;
}
