
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
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

  // Process the redirect result from Google Sign-In.
  // This should only run once on component mount.
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        // If result is not null, it means the user has just been redirected back
        // from Google. The onAuthStateChanged listener in SettingsProvider
        // will handle the user state update and subsequent redirection.
        // We can show a welcome toast here.
        if (result) {
          toast({
            title: `¡Bienvenido, ${result.user.displayName}!`,
            description: "Cargando tu panel de control...",
          });
        }
      })
      .catch((error) => {
        const authError = error as AuthError;
        console.error("Error processing Google sign-in redirect:", authError);
        
        let description = "Ocurrió un problema inesperado. Por favor, intenta de nuevo.";
        if (authError.code === 'auth/account-exists-with-different-credential') {
          description = "Ya existe una cuenta con este correo electrónico pero con un método de inicio de sesión diferente.";
        } else if (authError.code === 'auth/popup-blocked' || authError.code === 'auth/popup-closed-by-user') {
          description = "Tu navegador bloqueó la ventana de inicio de sesión. Por favor, permite las ventanas emergentes para este sitio.";
        } else if (authError.code === 'auth/unauthorized-domain') {
          description = "El dominio de esta aplicación no está autorizado para la autenticación. Por favor, contacta al administrador.";
        }

        toast({
          variant: "destructive",
          title: "Error de inicio de sesión",
          description: description,
        });
      });
  // The empty dependency array is crucial to make this run only once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to dashboard if the user is logged in and auth state is no longer loading.
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);


  const handleGoogleLogin = () => {
    const provider = new GoogleAuthProvider();
    const institutionDomain = process.env.NEXT_PUBLIC_INSTITUTION_DOMAIN;
    if (institutionDomain) {
      provider.setCustomParameters({ hd: institutionDomain });
    }
    signInWithRedirect(auth, provider);
  };

  // While the auth state is being determined, or if we have a user and are about to redirect,
  // show a loading screen. This prevents the login card from flashing after a successful login.
  if (isLoading || user) {
    return <LoadingScreen />;
  }

  // If auth state is determined and there's no user, show the login page.
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
