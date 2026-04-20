import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { devlog } from "@/lib/devlog/devlog";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listener zuerst
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      devlog.auth(`onAuthStateChange: ${event}`, {
        userId: newSession?.user?.id,
        email: newSession?.user?.email,
      });
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    // 2. Dann existierende Session abholen
    supabase.auth.getSession().then(({ data }) => {
      devlog.auth("getSession resolved", {
        hasSession: !!data.session,
        userId: data.session?.user?.id,
      });
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    devlog.auth("signOut requested");
    await supabase.auth.signOut();
  };

  return { session, user, loading, signOut };
}
