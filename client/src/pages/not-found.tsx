import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold" data-testid="text-404-title">404 - Siden blev ikke fundet</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Den side, du leder efter, findes ikke eller er blevet flyttet.
          </p>

          <Link href="/">
            <Button variant="outline" className="mt-4" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-1" /> Tilbage til Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
