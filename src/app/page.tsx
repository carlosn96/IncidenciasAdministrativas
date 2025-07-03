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
  const { user, isLoading } = useSettings();
  const [isProcessingClick, setIsProcessingClick] = useState(false);

  useEffect(() => {
    // Process the redirect result on page load.
    // The onAuthStateChanged listener in SettingsProvider will handle the user state.
    // We just need to handle potential errors here.
    getRedirectResult(auth).catch((error) => {
      const authError = error as AuthError;
      console.error("Error processing redirect result:", authError);
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: `Hubo un problema al verificar tus credenciales. (${authError.code})`,
      });
    });
  }, [toast]);

  useEffect(() => {
    // This effect handles redirecting the user to the dashboard once they are logged in.
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleGoogleLogin = async () => {
    setIsProcessingClick(true);
    const provider = new GoogleAuthProvider();
    const institutionDomain = process.env.NEXT_PUBLIC_INSTITUTION_DOMAIN;

    if (institutionDomain) {
      provider.setCustomParameters({ hd: institutionDomain });
    } else {
      console.warn("ADVERTENCIA: No se ha configurado un dominio institucional (NEXT_PUBLIC_INSTITUTION_DOMAIN). Se permitirá el acceso desde cualquier cuenta de Google. Esto es inseguro para producción.");
      toast({
          title: "Advertencia de Configuración",
          description: "No se ha configurado un dominio institucional. Se permitirá cualquier cuenta.",
      });
    }

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
      setIsProcessingClick(false);
    }
  };

  // Show a loading screen while we wait for the auth state to be resolved
  // or if the user is already logged in (in which case we're about to redirect).
  if (isLoading || user) {
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
            disabled={isProcessingClick}
          >
            <GoogleIcon className="mr-2 h-5 w-5" />
            {isProcessingClick ? "Redirigiendo..." : "Continuar con Google"}
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
