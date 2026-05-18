import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  // undefined = still loading, null = not logged in, User = logged in
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setIsLoggingOut(false);
    window.location.href = "/";
  };

  return {
    user,
    isLoading: user === undefined,
    isAuthenticated: !!user,
    logout,
    isLoggingOut,
  };
}
