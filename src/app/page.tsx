"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  // We rely *only* on the global state from our context.
  const { user, isLoading } = useSettings();
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  // This effect will run whenever the user or loading state changes.
  // It is the single source of truth for navigation.
  useEffect(() => {
    // If the initial auth check is done and we have a user, redirect.
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  // This effect handles the result of the redirect from Google.
  // It runs only once when the page loads.
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // User has successfully signed in.
          // The `onAuthStateChanged` listener in SettingsProvider will handle
          // setting the user state and triggering the redirect.
          toast({
            title: `¡Bienvenido, ${result.user.displayName}!`,
            description: "Redirigiendo a tu panel...",
          });
        }
      })
      .catch((error) => {
        // Handle Errors here.
        const authError = error as AuthError;
        console.error("Error during Google redirect:", authError);
        toast({
          variant: "destructive",
          title: "Error de inicio de sesión",
          description: `Hubo un problema al verificar tus credenciales. (${authError.code})`,
        });
      })
      .finally(() => {
        setIsProcessingLogin(false);
      });
  }, [toast]);


  const handleGoogleLogin = () => {
    setIsProcessingLogin(true); // Disable button to prevent multiple clicks
    const provider = new GoogleAuthProvider();
    const institutionDomain = process.env.NEXT_PUBLIC_INSTITUTION_DOMAIN;

    if (institutionDomain) {
      provider.setCustomParameters({ hd: institutionDomain });
    }

    // signInWithRedirect will navigate away, so we don't need complex error handling here.
    signInWithRedirect(auth, provider).catch((error) => {
      const authError = error as AuthError;
      console.error("Error initiating redirect login:", authError);
      toast({
        variant: "destructive",
        title: "Error de Autenticación",
        description: "No se pudo iniciar el proceso de inicio de sesión. Por favor, inténtalo de nuevo.",
      });
      setIsProcessingLogin(false); // Re-enable button on failure
    });
  };

  // While the auth state is being determined, or if the user is already
  // logged in (and we're about to redirect), show a loading screen.
  // This prevents a "flash" of the login page.
  if (isLoading || user) {
    return <LoadingScreen />;
  }

  // If we're not loading and there's no user, show the login page.
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
            disabled={isProcessingLogin}
          >
            <GoogleIcon className="mr-2 h-5 w-5" />
            {isProcessingLogin ? "Redirigiendo..." : "Continuar con Google"}
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
