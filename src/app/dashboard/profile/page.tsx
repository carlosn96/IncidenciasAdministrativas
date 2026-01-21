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
import { Camera, Save, Loader2, Check } from "lucide-react";
import { useSettings } from "@/context/settings-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const profileFormSchema = z.object({
  academicBackground: z.string().max(500, "Máximo 500 caracteres.").optional(),
  coordinatedCourses: z.string().max(500, "Máximo 500 caracteres.").optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
    const { user, userProfile, setUserProfile } = useSettings();
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            academicBackground: "",
            coordinatedCourses: "",
        },
    });

    useEffect(() => {
        if (userProfile) {
            form.reset({
                academicBackground: userProfile.academicBackground || "",
                coordinatedCourses: userProfile.coordinatedCourses || "",
            });
        }
    }, [userProfile, form]);

    const onSubmit = (data: ProfileFormValues) => {
        setSaveState('saving');
        
        setUserProfile({
            academicBackground: data.academicBackground || "",
            coordinatedCourses: data.coordinatedCourses || "",
        });

        // The useEffect in settings-context will handle saving to Firestore.
        // We just need to give user feedback.
        setTimeout(() => {
            setSaveState('saved');
            setTimeout(() => {
                setSaveState('idle');
            }, 2000);
        }, 1500);
    }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Gestión de Perfil</h1>
        <p className="text-muted-foreground">
          Ve y actualiza tu información personal.
        </p>
      </div>

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
                      : (<><Save /> Guardar Cambios</>)}
                  </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
