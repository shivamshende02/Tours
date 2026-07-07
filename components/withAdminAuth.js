// components/withAdminAuth.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function withAdminAuth(WrappedComponent) {
  return function ProtectedPage(props) {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
      async function checkAuth() {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles") // or your roles table
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error || !profile || profile.role !== "admin") {
          router.push("/login");
        } else {
          setAuthorized(true);
        }

        setLoading(false);
      }

      checkAuth();
    }, [router]);

    if (loading) return <p>Loading...</p>;
    if (!authorized) return <p>Not authorized</p>;

    return <WrappedComponent {...props} />;
  };
}
