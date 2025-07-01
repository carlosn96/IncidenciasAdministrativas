import { AppLogo } from "@/components/icons";
import { Loader2 } from "lucide-react";

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 rounded-lg bg-card p-8 shadow-2xl">
                <div className="flex items-center gap-4">
                     <div className="bg-white p-2 rounded-md">
                        <AppLogo className="h-10 w-10" />
                     </div>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <p className="mt-4 text-lg font-medium text-muted-foreground">Cargando...</p>
            </div>
        </div>
    );
}
