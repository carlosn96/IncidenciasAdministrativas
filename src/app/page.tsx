
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import { AppLogo, GoogleIcon } from "@/components/icons";
import { useSettings } from "@/context/settings-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { 
    user, 
    isLoading, 
    isFirebaseConfigured, 
    authError, 
    handleGoogleSignIn,
    isSigningIn,
  } = useSettings();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
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
              <AlertTitle>Firebase no configurado</AlertTitle>
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
                onClick={handleGoogleSignIn}
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
