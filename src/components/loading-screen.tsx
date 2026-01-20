import { AppLogo } from "@/components/icons";

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <div className="relative flex h-24 w-24 items-center justify-center">
                    <div className="absolute h-full w-full animate-pulse rounded-full bg-primary/20" />
                    <div 
                        className="absolute h-2/3 w-2/3 animate-pulse rounded-full bg-primary/30 [animation-delay:0.2s]"
                    />
                    <AppLogo className="relative h-10 w-auto" />
                </div>
                <p 
                    className="mt-4 text-lg font-medium text-muted-foreground animate-pulse [animation-delay:0.4s]"
                >
                    Cargando...
                </p>
            </div>
        </div>
    );
}
