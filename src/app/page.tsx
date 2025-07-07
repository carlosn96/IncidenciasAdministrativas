
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
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
  const { user, isLoading: isSettingsLoading } = useSettings();
  const { toast } = useToast();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<{ title: string, message: string } | null>(null);

  useEffect(() => {
    if (!isSettingsLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isSettingsLoading, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const authenticatedUser = result.user;

      // Robust domain validation after successful authentication
      if (!authenticatedUser.email || !authenticatedUser.email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        // Immediately sign out the user if their domain is not allowed
        await auth.signOut();
        setAuthError({
            title: "Dominio no Autorizado",
            message: `El acceso está restringido a cuentas del dominio @${ALLOWED_DOMAIN}. Por favor, inténtalo de nuevo con tu cuenta institucional.`
        });
        setIsSigningIn(false);
        return; // Stop further execution
      }

      // The onAuthStateChanged listener in SettingsProvider will handle the redirect.
      // We can show a toast here.
      toast({
        title: "¡Bienvenido de nuevo!",
        description: `Has iniciado sesión como ${authenticatedUser.displayName}.`,
      });
    } catch (error: any) {
        let title = "Error de Autenticación";
        let message = "Ocurrió un error desconocido. Por favor, intenta de nuevo.";
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
            case 'auth/cancelled-popup-request':
                title = "Proceso de inicio de sesión cancelado";
                message = "No se pudo completar el inicio de sesión. Esto puede ocurrir si cierras la ventana o si hay un problema con la cuenta de Google seleccionada. Por favor, inténtalo de nuevo.";
                break;
            case 'auth/popup-blocked':
                title = "Ventana emergente bloqueada";
                message = "Tu navegador bloqueó la ventana de inicio de sesión. Por favor, permite las ventanas emergentes para este sitio e inténtalo de nuevo.";
                break;
            case 'auth/account-exists-with-different-credential':
                title = "Cuenta ya existente";
                message = "Ya existe una cuenta con este correo, pero con un método de acceso diferente. Contacta a soporte técnico.";
                break;
            default:
                console.error("Firebase auth error:", error);
                message = "Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde."
                break;
        }

        setAuthError({ title, message });
    } finally {
        setIsSigningIn(false);
    }
  };

  if (isSettingsLoading) {
    return <LoadingScreen />;
  }
  
  // If user is logged in, useEffect will redirect.
  // We render null to avoid a flash of the login page.
  if(user) {
      return null;
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
