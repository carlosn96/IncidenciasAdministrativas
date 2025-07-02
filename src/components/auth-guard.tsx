'use client';

import { useSettings } from "@/context/settings-context";
import { LoadingScreen } from "@/components/loading-screen";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSettings();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
