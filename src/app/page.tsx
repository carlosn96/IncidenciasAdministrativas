
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { GoogleAuthProvider, signInWithPopup, AuthError } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    const institutionDomain = process.env.NEXT_PUBLIC_INSTITUTION_DOMAIN;

    if (!institutionDomain) {
      console.error("El dominio de la institución no está configurado en las variables de entorno.");
      toast({
        variant: "destructive",
        title: "Error de Configuración",
        description: "El administrador no ha configurado el dominio de la institución.",
      });
      setIsLoading(false);
      return;
    }

    provider.setCustomParameters({ hd: institutionDomain });

    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error de autenticación:", authError.code, authError.message);
      
      let description = "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.";
      if (authError.code === 'auth/popup-closed-by-user') {
        description = "Has cerrado la ventana de inicio de sesión. Por favor, inténtalo de nuevo.";
      } else if (authError.code === 'auth/cancelled-popup-request') {
        description = "Se ha cancelado el inicio de sesión.";
      } else if (authError.code === 'auth/operation-not-allowed') {
         description = "El inicio de sesión con Google no está habilitado. Contacta al administrador.";
      } else {
        description = `Por favor, utiliza una cuenta de correo con el dominio @${institutionDomain}.`;
      }

      toast({
        variant: "destructive",
        title: "Inicio de Sesión Fallido",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <LoadingScreen />}
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
    </>
  );
}
