import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { syncPeriodToSheet } from '@/lib/google-sheets-actions';
import { Button } from '@/components/ui/button';

export function useSyncPeriod() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const sync = async (periodId: string, userId: string) => {
    if (!periodId || !userId) return;
    setIsSyncing(true);
    try {
      const result = await syncPeriodToSheet(periodId, userId);
      if (result.success && result.spreadsheetUrl) {
        toast({
          title: "Sincronización Exitosa",
          description: "El periodo se ha sincronizado con Google Sheets.",
          action: (
            <Button asChild variant="outline">
              <a href={result.spreadsheetUrl} target="_blank" rel="noopener noreferrer">
                Abrir Hoja
              </a>
            </Button>
          ),
        });
      } else {
        throw new Error(result.error || "Ocurrió un error desconocido.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de Sincronización",
        description: error.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return { sync, isSyncing };
}