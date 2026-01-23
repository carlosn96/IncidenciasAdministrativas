
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

const profileFormSchema = z.object({
  academicBackground: z.string().max(500, "Máximo 500 caracteres.").optional(),
  coordinatedCourses: z.string().max(500, "Máximo 500 caracteres.").optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
    const { user, userProfile, updateUserProfile, refetchData } = useSettings();
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [integrationState, setIntegrationState] = useState<'idle' | 'loading'>('idle');
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            academicBackground: "",
            coordinatedCourses: "",
        },
        mode: "onBlur"
    });
    
    useEffect(() => {
        if (userProfile) {
            form.reset({
                academicBackground: userProfile.academicBackground || "",
                coordinatedCourses: userProfile.coordinatedCourses || "",
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Gestión de Perfil</h1>
        <p className="text-muted-foreground">
          Ve y actualiza tu información personal y tus integraciones.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                <CardTitle>Detalles Personales</CardTitle>
                <CardDescription>
                    Mantén tu información de perfil actualizada.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                        <AvatarImage src={user?.photoURL ?? ""} data-ai-hint="user avatar" />
                        <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
                        </Avatar>
                        <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            {/* The span is needed to make the tooltip work on a disabled button */}
                            <span tabIndex={0}>
                                <Button type="button" variant="outline" disabled>
                                <Camera className="mr-2 h-4 w-4" />
                                Cambiar Foto
                                </Button>
                            </span>
                            </TooltipTrigger>
                            <TooltipContent>
                            <p>Esta función requiere un plan de pago en Firebase.</p>
                            </TooltipContent>
                        </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input id="name" defaultValue={user?.displayName ?? ""} readOnly className="bg-muted/50" />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input
                            id="email"
                            type="email"
                            defaultValue={user?.email ?? ""}
                            readOnly
                            className="bg-muted/50"
                        />
                        </div>
                    </div>
                    
                    <FormField
                        control={form.control}
                        name="academicBackground"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Formación Académica</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="Ej: Doctorado en Ciencias de la Computación"
                                {...field}
                            />
                            </FormControl>
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
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <div className="flex justify-end">
                        <Button type="submit" disabled={saveState !== 'idle' || !form.formState.isDirty} className="w-[180px]">
                            {saveState === 'saving' ? (<><Loader2 className="animate-spin" /> Guardando...</>)
                            : saveState === 'saved' ? (<><Check /> Guardado</>)
                            : (<><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>)}
                        </Button>
                    </div>
                    </form>
                </Form>
                </CardContent>
            </Card>
        </div>
        
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Integraciones</CardTitle>
                    <CardDescription>
                        Conecta la aplicación con otros servicios.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border rounded-lg p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                           <GoogleIcon className="h-6 w-6" />
                         </div>
                         <div>
                            <p className="font-semibold">Google Sheets</p>
                            <p className={`text-sm ${isGoogleConnected ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                {isGoogleConnected ? 'Conectado' : 'No conectado'}
                            </p>
                         </div>
                       </div>
                       
                        {isGoogleConnected ? (
                           <Button 
                             variant="destructive" 
                             onClick={handleGoogleDisconnect} 
                             disabled={integrationState === 'loading'}
                             className="w-[150px]"
                           >
                              {integrationState === 'loading' ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <>
                                  <LogOut className="mr-2 h-4 w-4" />
                                  Desconectar
                                </>
                              )}
                           </Button>
                        ) : (
                           <Button 
                             onClick={handleGoogleConnect}
                             disabled={integrationState === 'loading'}
                             className="w-[150px]"
                           >
                             {integrationState === 'loading' ? (
                                <Loader2 className="animate-spin" />
                             ) : (
                                <>
                                  <LinkIcon className="mr-2 h-4 w-4" />
                                  Conectar
                                </>
                             )}
                           </Button>
                        )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground p-2">
                        <AlertTriangle className="inline-block h-3 w-3 mr-1" />
                        Al conectar, autorizas a esta aplicación a crear y editar hojas de cálculo en tu cuenta de Google Drive.
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
