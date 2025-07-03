
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { LoadingScreen } from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import { AppLogo, GoogleIcon } from "@/components/icons";
import { useSettings } from "@/context/settings-context";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: isSettingsLoading } = useSettings();
  const { toast } = useToast();

  const [isProcessingLogin, setIsProcessingLogin] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSettingsLoading) {
      if (user) {
        // If user is already available from context, redirect to dashboard
        router.replace("/dashboard");
      } else {
        // If no user, we are ready for login
        setIsProcessingLogin(false);
      }
    }
  }, [user, isSettingsLoading, router]);

  const handleSignIn = async () => {
    setIsProcessingLogin(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        toast({
          title: "¡Bienvenido de nuevo!",
          description: `Has iniciado sesión como ${result.user.displayName}.`,
        });
        router.replace("/dashboard");
      }
    } catch (error: any) {
      let errorMessage = "Ocurrió un error desconocido al iniciar sesión.";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "El inicio de sesión fue cancelado.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "Ya existe una cuenta con este correo electrónico pero con un método de inicio de sesión diferente.";
      }
      setAuthError(errorMessage);
      setIsProcessingLogin(false);
    }
  };

  if (isSettingsLoading || isProcessingLogin) {
    return <LoadingScreen />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <AppLogo className="mx-auto h-16 w-auto" />
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                Sistema de Incidencias
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
                Inicia sesión para registrar tus horas
            </p>
        </div>

        {authError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error de Autenticación</AlertTitle>
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        <div className="mt-8 space-y-6">
            <Button
              onClick={handleSignIn}
              size="lg"
              className="w-full h-12 text-base"
              disabled={isProcessingLogin}
            >
              <GoogleIcon className="mr-3 h-5 w-5" />
              Entrar con Google
            </Button>
        </div>

        <p className="mt-10 text-center text-xs text-gray-500">
          Desarrollado para la Coordinación Académica
        </p>
      </div>
    </main>
  );
}
