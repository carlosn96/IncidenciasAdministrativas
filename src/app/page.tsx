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

  // Effect to handle redirecting once a user is detected
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  // Effect to process the result of a sign-in redirect.
  // This should only run once on component mount.
  useEffect(() => {
    // getRedirectResult should be called every time the page loads.
    // It returns the user credential on a successful redirect or null otherwise.
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // Login was successful. The onAuthStateChanged listener in
          // SettingsProvider is already handling setting the user state.
          // We can just show a welcome message.
          toast({
            title: `¡Bienvenido, ${result.user.displayName}!`,
            description: "Cargando tu panel...",
          });
        }
      })
      .catch((error) => {
        // Handle common errors.
        const authError = error as AuthError;
        console.error("Error during Google redirect:", authError);
        toast({
          variant: "destructive",
          title: "Error de inicio de sesión",
          description: `Hubo un problema al verificar tus credenciales. (${authError.code})`,
        });
      });
  }, [toast]);

  const handleGoogleLogin = () => {
    const provider = new GoogleAuthProvider();
    const institutionDomain = process.env.NEXT_PUBLIC_INSTITUTION_DOMAIN;
    if (institutionDomain) {
      provider.setCustomParameters({ hd: institutionDomain });
    }
    // signInWithRedirect navigates away. Errors are caught by getRedirectResult on the return.
    signInWithRedirect(auth, provider);
  };

  // Show a loading screen while Firebase is initializing OR if a user
  // is already detected and we are about to redirect. This prevents any UI flicker.
  if (isLoading || user) {
    return <LoadingScreen />;
  }

  // If we're done loading and there's no user, show the login page.
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
            // Disable the button while the initial auth check is happening.
            disabled={isLoading}
          >
            <GoogleIcon className="mr-2 h-5 w-5" />
            {isLoading ? "Cargando..." : "Continuar con Google"}
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
