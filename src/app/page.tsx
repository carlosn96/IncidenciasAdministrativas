
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { LoadingScreen } from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import { AppLogo, GoogleIcon } from "@/components/icons";
import { useSettings } from "@/context/settings-context";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const ALLOWED_DOMAIN = "universidad-une.com";
const NO_AUTH_MODE = process.env.NEXT_PUBLIC_NO_AUTH_MODE === 'true';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: isSettingsLoading } = useSettings();
  const { toast } = useToast();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<{ title: string, message: string } | null>(null);

  useEffect(() => {
    // If a user object exists (real or mocked), redirect to the dashboard.
    if (!isSettingsLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isSettingsLoading, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (!email || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        await signOut(auth); // Sign out the user immediately
        setAuthError({
          title: "Dominio no Autorizado",
          message: `El acceso está restringido a cuentas del dominio @${ALLOWED_DOMAIN}. Por favor, utiliza tu cuenta institucional.`
        });
        setIsSigningIn(false);
        return;
      }
      
      toast({
        title: `¡Bienvenido de nuevo, ${result.user.displayName?.split(" ")[0]}!`,
        description: `Has iniciado sesión correctamente.`,
      });
      // The onAuthStateChanged listener in the context will handle redirect.
      
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError({
          title: 'Proceso de inicio de sesión cancelado',
          message: 'No se pudo completar el inicio de sesión. Esto puede ocurrir si cierras la ventana o si hay un problema con la cuenta de Google seleccionada. Por favor, inténtalo de nuevo.'
        });
      } else {
        console.error("Authentication error:", error);
        setAuthError({
          title: "Error de Autenticación",
          message: "Ocurrió un error inesperado al intentar iniciar sesión. Por favor, revisa la consola para más detalles."
        });
      }
    } finally {
      setIsSigningIn(false);
    }
  };
  
  // In No-Auth mode, the context will provide a mock user, and the useEffect above
  // will handle the redirect. We show a loading screen while this happens.
  if (NO_AUTH_MODE || isSettingsLoading || user) {
    return <LoadingScreen />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <AppLogo className="h-10 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">
            Incidencias Administrativas
          </CardTitle>
          <CardDescription>
            Inicia sesión con tu cuenta de Google para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {authError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{authError.title}</AlertTitle>
              <AlertDescription>{authError.message}</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={handleSignIn}
            size="lg"
            className="w-full h-12 text-base"
            disabled={isSigningIn}
          >
            <GoogleIcon className="mr-3 h-5 w-5" />
            {isSigningIn ? 'Iniciando sesión...' : 'Entrar con Google'}
          </Button>
        </CardContent>
        <CardFooter>
          <p className="w-full text-center text-xs text-muted-foreground">
            Centro Universitario UNE A. C.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
