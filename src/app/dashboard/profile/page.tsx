"use client";

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
import { useToast } from "@/hooks/use-toast";
import { Camera, Save } from "lucide-react";
import { useSettings } from "@/context/settings-context";

export default function ProfilePage() {
    const { toast } = useToast();
    const { user } = useSettings();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Perfil Actualizado",
            description: "Tu información ha sido guardada exitosamente.",
        });
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
              <Button type="button" variant="outline">
                <Camera className="mr-2 h-4 w-4" />
                Cambiar Foto
              </Button>
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
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
