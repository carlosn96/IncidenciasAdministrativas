"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getInspirationalQuoteAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { InspirationalQuoteOutput } from "@/ai/flows/generate-inspirational-quote";

export function QuoteCard() {
  const [isPending, startTransition] = useTransition();
  const [quote, setQuote] = useState<InspirationalQuoteOutput | null>(null);
  const { toast } = useToast();

  const fetchQuote = () => {
    startTransition(async () => {
      const result = await getInspirationalQuoteAction("entrepreneurship");
      if (result.success) {
        setQuote(result.data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    });
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-yellow-400" />
          <CardTitle>Inspirational Quote</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="min-h-[100px]">
        {isPending && !quote ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/5" />
          </div>
        ) : quote ? (
          <blockquote className="space-y-2">
            <p className="text-lg font-medium">"{quote.quote}"</p>
            <footer className="text-sm text-muted-foreground">
              — {quote.author}
            </footer>
          </blockquote>
        ) : (
          <p className="text-muted-foreground">Could not load a quote.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={fetchQuote} disabled={isPending} size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          New Quote
        </Button>
      </CardFooter>
    </Card>
  );
}
