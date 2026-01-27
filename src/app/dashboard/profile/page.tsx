
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, Loader2, Check, Link as LinkIcon, AlertTriangle, LogOut } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getGoogleAuthUrl, disconnectGoogleAccount } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { AppLogo, GoogleIcon } from "@/components/icons";
import { useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

const profileFormSchema = z.object({
  academicBackground: z.string().max(500, "Máximo 500 caracteres.").optional(),
  coordinatedCourses: z.string().max(500, "Máximo 500 caracteres.").optional(),
  googleDriveFolderId: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
    const { user, userProfile, updateUserProfile, refetchData } = useSettings();
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [integrationState, setIntegrationState] = useState<'idle' | 'loading'>('idle');
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            academicBackground: "",
            coordinatedCourses: "",
            googleDriveFolderId: "",
        },
        mode: "onBlur"
    });
    
    useEffect(() => {
        if (userProfile) {
            form.reset({
                academicBackground: userProfile.academicBackground || "",
                coordinatedCourses: userProfile.coordinatedCourses || "",
                googleDriveFolderId: userProfile.googleDriveFolderId || "",
            });
        }
    }, [userProfile, form]);
    
    useEffect(() => {
        const success = searchParams.get('success');
        if (success === 'google_connected') {
            refetchData();
        }
    }, [searchParams, refetchData]);

    const onSubmit = (data: ProfileFormValues) => {
        setSaveState('saving');
        
        updateUserProfile(prev => ({
            ...prev,
            academicBackground: data.academicBackground || "",
            coordinatedCourses: data.coordinatedCourses || "",
            googleDriveFolderId: data.googleDriveFolderId || "",
        }));

        setTimeout(() => {
            setSaveState('saved');
             form.reset(data); // Resetea el form state a los nuevos valores "sucios"
            setTimeout(() => {
                setSaveState('idle');
            }, 2000);
        }, 1500);
    }
    
    const handleGoogleConnect = async () => {
      if (!user) return;
      setIntegrationState('loading');
      try {
        const { url } = await getGoogleAuthUrl(user.uid);
        window.location.href = url;
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error al conectar",
          description: "No se pudo generar la URL de autenticación de Google.",
        });
        setIntegrationState('idle');
      }
    };
    
    const handleGoogleDisconnect = async () => {
        if (!user) return;
        setIntegrationState('loading');
        try {
            const result = await disconnectGoogleAccount(user.uid);
            if (result.success) {
                // The server action removed the token from DB. Now update local state.
                updateUserProfile(prev => ({ ...prev, googleRefreshToken: undefined }));
                toast({
                    title: "Cuenta desconectada",
                    description: "Tu cuenta de Google ha sido desvinculada.",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error al desconectar",
                description: error.message || "No se pudo desvincular tu cuenta de Google.",
            });
        } finally {
            setIntegrationState('idle');
        }
    };

    const isGoogleConnected = !!userProfile?.googleRefreshToken;

  return (
    <main className="space-y-6 lg:space-y-8" role="main" aria-labelledby="profile-heading">
      <header className="space-y-2">
        <h1 id="profile-heading" className="text-2xl md:text-3xl font-bold font-headline">Gestión de Perfil</h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Ve y actualiza tu información personal y tus integraciones.
        </p>
      </header>

      <div className="space-y-6 lg:space-y-8">
        {/* Integrations Section - Show first on mobile for quick access */}
        {isMobile && (
          <section aria-labelledby="integrations-heading">
            <Card>
              <CardHeader>
                <CardTitle id="integrations-heading">Integraciones</CardTitle>
                <CardDescription>
                  Conecta la aplicación con otros servicios.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50 flex-shrink-0">
                        <GoogleIcon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">Google Sheets</p>
                        <p className={`text-sm ${isGoogleConnected ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {isGoogleConnected ? 'Conectado' : 'No conectado'}
                        </p>
                      </div>
                    </div>

                    <div className="w-full">
                      {isGoogleConnected ? (
                        <Button
                          variant="destructive"
                          onClick={handleGoogleDisconnect}
                          disabled={integrationState === 'loading'}
                          className="w-full"
                          aria-describedby="google-disconnect-desc"
                        >
                          {integrationState === 'loading' ? (
                            <Loader2 className="animate-spin mr-2 h-4 w-4" aria-hidden="true" />
                          ) : (
                            <>
                              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                              Desconectar
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleGoogleConnect}
                          disabled={integrationState === 'loading'}
                          className="w-full"
                          aria-describedby="google-connect-desc"
                        >
                          {integrationState === 'loading' ? (
                            <Loader2 className="animate-spin mr-2 h-4 w-4" aria-hidden="true" />
                          ) : (
                            <>
                              <LinkIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                              Conectar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-md" role="note">
                  <AlertTriangle className="inline-block h-3 w-3 mr-1 flex-shrink-0" aria-hidden="true" />
                  <span className="break-words">
                    Al conectar, autorizas a esta aplicación a crear y editar hojas de cálculo en tu cuenta de Google Drive.
                    Si configuras un ID de carpeta, las hojas se crearán ahí; de lo contrario, en la raíz.
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Personal Details Section */}
        <section aria-labelledby="personal-details-heading">
          <Card>
            <CardHeader>
              <CardTitle id="personal-details-heading">Detalles Personales</CardTitle>
              <CardDescription>
                Mantén tu información de perfil actualizada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
                  {/* Profile Picture Section */}
                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-foreground sr-only">Foto de Perfil</legend>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Avatar className="h-16 w-16 sm:h-20 sm:w-20" aria-label={`Avatar de ${user?.displayName || 'usuario'}`}>
                        <AvatarImage src={user?.photoURL ?? ""} alt={`Foto de perfil de ${user?.displayName || 'usuario'}`} />
                        <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
                      </Avatar>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}>
                              <Button
                                type="button"
                                variant="outline"
                                disabled
                                className="w-full sm:w-auto"
                                aria-describedby="photo-tooltip"
                              >
                                <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
                                Cambiar Foto
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent id="photo-tooltip">
                            <p>Esta función requiere un plan de pago en Firebase.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </fieldset>

                  {/* Basic Information */}
                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-foreground">Información Básica</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input
                          id="name"
                          defaultValue={user?.displayName ?? ""}
                          readOnly
                          className="bg-muted/50"
                          aria-describedby="name-desc"
                        />
                        <p id="name-desc" className="sr-only">Este campo es de solo lectura y muestra tu nombre completo</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue={user?.email ?? ""}
                          readOnly
                          className="bg-muted/50"
                          aria-describedby="email-desc"
                        />
                        <p id="email-desc" className="sr-only">Este campo es de solo lectura y muestra tu correo electrónico</p>
                      </div>
                    </div>
                  </fieldset>

                  {/* Academic Information */}
                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-foreground">Información Académica</legend>
                    
                    <FormField
                        control={form.control}
                        name="academicBackground"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Formación Académica</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="Ej: Doctorado en Ciencias de la Computación"
                                className="min-h-[100px]"
                                {...field}
                                aria-describedby="academic-desc"
                            />
                            </FormControl>
                            <p id="academic-desc" className="text-sm text-muted-foreground">
                              Máximo 500 caracteres. Describe tu formación académica.
                            </p>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="coordinatedCourses"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cursos Coordinados</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="Ej: Introducción a la Programación, Algoritmos Avanzados"
                                className="min-h-[100px]"
                                {...field}
                                aria-describedby="courses-desc"
                            />
                            </FormControl>
                            <p id="courses-desc" className="text-sm text-muted-foreground">
                              Máximo 500 caracteres. Lista los cursos que has coordinado.
                            </p>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  </fieldset>

                  {/* Google Drive Configuration */}
                  <fieldset className="space-y-4">
                    <legend className="text-sm font-medium text-foreground">Configuración de Google Drive</legend>
                    <FormField
                        control={form.control}
                        name="googleDriveFolderId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>ID de Carpeta de Google Drive (Opcional)</FormLabel>
                            <FormControl>
                            <Input
                                placeholder="Ej: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                                {...field}
                                aria-describedby="folder-desc"
                            />
                            </FormControl>
                            <p id="folder-desc" className="text-sm text-muted-foreground">
                              Especifica el ID de una carpeta de Google Drive donde se crearán las hojas de cálculo.
                            </p>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  </fieldset>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={saveState !== 'idle' || !form.formState.isDirty}
                      className="w-full sm:w-[180px]"
                      aria-describedby="save-desc"
                    >
                      {saveState === 'saving' ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" aria-hidden="true" />
                          Guardando...
                        </>
                      ) : saveState === 'saved' ? (
                        <>
                          <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                          Guardado
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                    <p id="save-desc" className="sr-only">
                      Guarda los cambios realizados en tu perfil. El botón se habilita cuando hay cambios pendientes.
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </section>

        {/* Integrations Section - Desktop only */}
        {!isMobile && (
          <section aria-labelledby="integrations-heading-desktop">
            <Card>
              <CardHeader>
                <CardTitle id="integrations-heading-desktop">Integraciones</CardTitle>
                <CardDescription>
                  Conecta la aplicación con otros servicios.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50 flex-shrink-0">
                        <GoogleIcon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">Google Sheets</p>
                        <p className={`text-sm truncate ${isGoogleConnected ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {isGoogleConnected ? 'Conectado' : 'No conectado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-full sm:w-auto">
                      {isGoogleConnected ? (
                        <Button
                          variant="destructive"
                          onClick={handleGoogleDisconnect}
                          disabled={integrationState === 'loading'}
                          className="w-full sm:w-[150px]"
                          aria-describedby="google-disconnect-desc"
                        >
                          {integrationState === 'loading' ? (
                            <Loader2 className="animate-spin" aria-hidden="true" />
                          ) : (
                            <>
                              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                              Desconectar
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleGoogleConnect}
                          disabled={integrationState === 'loading'}
                          className="w-full sm:w-[150px]"
                          aria-describedby="google-connect-desc"
                        >
                          {integrationState === 'loading' ? (
                            <Loader2 className="animate-spin" aria-hidden="true" />
                          ) : (
                            <>
                              <LinkIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                              Conectar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md" role="note">
                  <AlertTriangle className="inline-block h-3 w-3 mr-1 flex-shrink-0" aria-hidden="true" />
                  <span className="break-words">
                    Al conectar, autorizas a esta aplicación a crear y editar hojas de cálculo en tu cuenta de Google Drive.
                    Si configuras un ID de carpeta, las hojas se crearán ahí; de lo contrario, en la raíz.
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}
