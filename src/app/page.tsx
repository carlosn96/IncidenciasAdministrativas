
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

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: isSettingsLoading, isFirebaseConfigured } = useSettings();
  const { toast } = useToast();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<{ title: string, message: string } | null>(null);

  useEffect(() => {
    // If a user object exists, redirect to the dashboard.
    if (!isSettingsLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isSettingsLoading, router]);

  const handleSignIn = async () => {
    if (!auth || !provider) return;

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
      // The onAuthStateChanged listener in the context will handle the redirect.
      
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
  
  if (isSettingsLoading || user) {
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
            {isFirebaseConfigured ? "Inicia sesión con tu cuenta de Google para continuar." : "Configuración Requerida"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isFirebaseConfigured ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Firebase no está configurado</AlertTitle>
              <AlertDescription>
                <p>La aplicación no puede conectarse a la base de datos.</p>
                <p className="mt-2">Por favor, añade tus credenciales de proyecto de Firebase al archivo <strong>.env</strong> en la raíz del proyecto para continuar.</p>
              </AlertDescription>
            </Alert>
          ) : (
            <>
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
            </>
          )}
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
