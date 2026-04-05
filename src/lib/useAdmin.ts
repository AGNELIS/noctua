import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
      setIsAdmin(data?.is_admin || false);
    };
    check();
  }, []);

  return isAdmin;
}