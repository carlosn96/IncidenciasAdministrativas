"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppLogo, GoogleIcon } from "@/components/icons";
import { LoadingScreen } from "@/components/loading-screen";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, AuthError } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-context";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useSettings();
  const [isProcessingLogin, setIsProcessingLogin] = useState(true);

  // Effect to handle redirecting once a user is authenticated
  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isAuthLoading, router]);

  // Effect to process the result of a sign-in redirect.
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // A user has successfully signed in via redirect.
          // The onAuthStateChanged listener in SettingsProvider will handle
          // setting the user state and triggering the redirect to dashboard.
          toast({
            title: `¡Bienvenido, ${result.user.displayName}!`,
            description: "Cargando tu panel de control...",
          });
          // The other useEffect will handle the redirect once `user` is set.
        } else {
          // No redirect result, which is the normal case on a fresh page load.
          setIsProcessingLogin(false);
        }
      })
      .catch((error) => {
        const authError = error as AuthError;
        console.error("Error processing Google sign-in redirect:", authError);
        
        let description = "Ocurrió un problema inesperado. Por favor, intenta de nuevo.";
        if (authError.code === 'auth/unauthorized-domain') {
          description = "El dominio de esta aplicación no está autorizado en Firebase. Por favor, contacta al administrador.";
        } else if (authError.code === 'auth/popup-blocked' || authError.code === 'auth/popup-closed-by-user') {
            description = "Tu navegador bloqueó la ventana de inicio de sesión. Por favor, permite las ventanas emergentes para este sitio.";
        }

        toast({
          variant: "destructive",
          title: "Error de inicio de sesión",
          description: description,
        });
        setIsProcessingLogin(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLogin = () => {
    setIsProcessingLogin(true);
    const provider = new GoogleAuthProvider();
    const institutionDomain = process.env.NEXT_PUBLIC_INSTITUTION_DOMAIN;
    if (institutionDomain) {
      provider.setCustomParameters({ hd: institutionDomain });
    }
    signInWithRedirect(auth, provider);
  };

  // Show a full-page loading screen if the initial auth check is happening,
  // or if we are processing a login redirect. This prevents any UI flicker.
  if (isAuthLoading || isProcessingLogin || user) {
    return <LoadingScreen />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <AppLogo className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-headline">
            Incidencias Administrativas
          </CardTitle>
          <CardDescription>
            Accede a tu panel con tu cuenta institucional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full h-12 text-base"
            onClick={handleGoogleLogin}
            disabled={isAuthLoading || isProcessingLogin}
          >
            <GoogleIcon className="mr-2 h-5 w-5" />
            Continuar con Google
          </Button>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            Utiliza tu cuenta de Google proporcionada por la institución para acceder.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
