
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { useSettings } from "@/context/settings-context";

export default function LoginPage() {
  const router = useRouter();
  const { isLoading, user } = useSettings();

  useEffect(() => {
    // In local mode, once we confirm we have a user (even a mock one),
    // we redirect to the dashboard.
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  // Show a loading screen to prevent any flashing and to wait for the
  // settings context to provide the user object.
  return <LoadingScreen />;
}
