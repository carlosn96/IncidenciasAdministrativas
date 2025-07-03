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
  const { user, isLoading } = useSettings();
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  // Effect to handle redirecting once a user is authenticated
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  // Effect to process the result of a sign-in redirect.
  useEffect(() => {
    // This effect should only run once on component mount.
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // A user was successfully signed in via redirect.
          // The onAuthStateChanged listener in SettingsProvider will handle the user state update.
          // We can show a welcome toast. The effect above will handle the actual redirect to the dashboard.
          toast({
            title: `¡Bienvenido, ${result.user.displayName}!`,
            description: "Cargando tu panel de control...",
          });
        }
        // If result is null, it means the user is just visiting the page, not coming back from a redirect.
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
      })
      .finally(() => {
        // We are done checking for a redirect result.
        setIsProcessingRedirect(false);
      });
  // The empty dependency array is crucial to make this run only once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLogin = () => {
    const provider = new GoogleAuthProvider();
    const institutionDomain = process.env.NEXT_PUBLIC_INSTITUTION_DOMAIN;
    if (institutionDomain) {
      provider.setCustomParameters({ hd: institutionDomain });
    }
    signInWithRedirect(auth, provider);
  };

  // Show a loading screen if the initial auth state is still being determined,
  // or if we are still processing a potential redirect from Google.
  if (isLoading || isProcessingRedirect) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 p-4">
        <LoadingScreen />
      </main>
    );
  }
  
  // If after all loading, there's a user, it means we are about to redirect.
  // Show a loading screen to prevent the login card from flashing.
  if (user) {
    return (
       <main className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 p-4">
        <LoadingScreen />
      </main>
    )
  }

  // If there's no user, show the login card.
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