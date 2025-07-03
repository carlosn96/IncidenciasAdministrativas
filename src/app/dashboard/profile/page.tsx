
"use client";

import { useState } from "react";
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


export default function ProfilePage() {
    const { user } = useSettings();
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaveState('saving');
        
        // In a real app, this would be an async operation to save data.
        // We'll simulate it with a timeout.
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
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <Input id="name" defaultValue={user?.displayName ?? ""} />
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
            <div className="space-y-2">
              <Label htmlFor="background">Formación Académica</Label>
              <Textarea
                id="background"
                placeholder="Ej: Doctorado en Ciencias de la Computación"
                defaultValue=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courses">Cursos Coordinados</Label>
              <Textarea
                id="courses"
                placeholder="Ej: Introducción a la Programación, Algoritmos Avanzados"
                defaultValue=""
              />
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={saveState !== 'idle'} className="w-[180px]">
                    {saveState === 'saving' ? (<><Loader2 className="animate-spin" /> Guardando...</>)
                    : saveState === 'saved' ? (<><Check /> Guardado</>)
                    : (<><Save /> Guardar Cambios</>)}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
