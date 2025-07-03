
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
import { GoogleAuthProvider, signInWithRedirect, AuthError } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/settings-context";

export default function LoginPage() {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useSettings();

  useEffect(() => {
    // When the auth state is resolved, if we have a user, redirect to the dashboard.
    // This handles the redirect back from Google.
    if (!isAuthLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isAuthLoading, router]);


  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    const institutionDomain = process.env.NEXT_PUBLIC_INSTITUTION_DOMAIN;

    if (!institutionDomain) {
        console.error("El dominio de la institución no está configurado en las variables de entorno.");
        toast({
            variant: "destructive",
            title: "Error de Configuración",
            description: "El administrador no ha configurado el dominio de la institución.",
        });
        setIsSigningIn(false);
        return;
    }

    provider.setCustomParameters({ hd: institutionDomain });

    try {
        await signInWithRedirect(auth, provider);
        // The browser will now redirect to Google's sign-in page.
        // After login, the page will reload and the useEffect above will handle redirection.
    } catch (error) {
        const authError = error as AuthError;
        console.error("Error al iniciar el inicio de sesión con redirección:", authError.code, authError.message);
        toast({
            variant: "destructive",
            title: "Error de Autenticación",
            description: "No se pudo iniciar el proceso de inicio de sesión. Por favor, inténtalo de nuevo.",
        });
        setIsSigningIn(false);
    }
  };

  // Show a loading screen while auth is being checked or if a user is found (which means we are about to redirect).
  // This prevents the login form from flashing on screen for already logged-in users.
  if (isAuthLoading || user) {
    return <LoadingScreen />;
  }

  // Only show the login page if we're done loading and there's no user.
  return (
    <>
      {isSigningIn && <LoadingScreen />}
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
              disabled={isSigningIn}
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
    </>
  );
}
