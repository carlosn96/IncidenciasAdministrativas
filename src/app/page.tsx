
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
  const [isProcessingLogin, setIsProcessingLogin] = useState(true); // Start true to show loader on initial load
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useSettings();

  useEffect(() => {
    // This effect runs once on component mount to process any pending redirect sign-in.
    const processRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        // If 'result' is not null, it means a sign-in redirect has just completed.
        // The onAuthStateChanged listener in SettingsProvider will handle the user state update,
        // and the other useEffect will then redirect to the dashboard.
        // We don't need to do anything with the 'result' object here.
      } catch (error) {
        const authError = error as AuthError;
        // Handle specific errors, e.g., account exists with different credential
        console.error("Error processing redirect result:", authError);
        toast({
          variant: "destructive",
          title: "Error de inicio de sesión",
          description: "Hubo un problema al verificar tus credenciales. Por favor, intenta de nuevo.",
        });
      } finally {
        // We're done processing the redirect, so we can stop showing the main loader.
        // The rest of the loading logic is handled by isAuthLoading and the user object.
        setIsProcessingLogin(false);
      }
    };

    processRedirectResult();
  }, [toast]);

  useEffect(() => {
    // This effect handles redirecting the user to the dashboard once they are logged in.
    if (!isAuthLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isAuthLoading, router]);

  const handleGoogleLogin = async () => {
    setIsProcessingLogin(true); // Show loader when user clicks login
    const provider = new GoogleAuthProvider();
    const institutionDomain = process.env.NEXT_PUBLIC_INSTITUTION_DOMAIN;

    if (!institutionDomain) {
      console.error("El dominio de la institución no está configurado en las variables de entorno.");
      toast({
        variant: "destructive",
        title: "Error de Configuración",
        description: "El administrador no ha configurado el dominio de la institución.",
      });
      setIsProcessingLogin(false);
      return;
    }

    provider.setCustomParameters({ hd: institutionDomain });

    try {
      await signInWithRedirect(auth, provider);
      // The browser will now redirect to Google's sign-in page.
      // After login, the page will reload, and the useEffects above will handle the result.
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error al iniciar el inicio de sesión con redirección:", authError.code, authError.message);
      toast({
        variant: "destructive",
        title: "Error de Autenticación",
        description: "No se pudo iniciar el proceso de inicio de sesión. Por favor, inténtalo de nuevo.",
      });
      setIsProcessingLogin(false);
    }
  };

  // Show a loading screen while we process a potential redirect, while auth state is loading, or if a user object already exists (which means we are about to redirect).
  if (isProcessingLogin || isAuthLoading || user) {
    return <LoadingScreen />;
  }

  // Only show the login page if we're done loading and there's no user.
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
