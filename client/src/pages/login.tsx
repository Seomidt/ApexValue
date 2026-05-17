import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = mode === "login" ? "/api/login" : "/api/auth/register";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Fejl");
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/app");
    } catch (err: any) {
      toast({ title: "Fejl", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#002776]">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader className="text-center">
          <div className="text-3xl font-bold text-[#FF6319] mb-1">APEX<span className="text-[#002776]">VALUE</span></div>
          <CardTitle>{mode === "login" ? "Log ind" : "Opret konto"}</CardTitle>
          <CardDescription>B2B bil handel & vurdering</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Adgangskode</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-[#FF6319] hover:bg-[#e5581a]" disabled={isLoading}>
              {isLoading ? "Vent..." : mode === "login" ? "Log ind" : "Opret konto"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {mode === "login" ? (
              <span>Ingen konto? <button className="text-[#FF6319] underline" onClick={() => setMode("register")}>Opret her</button></span>
            ) : (
              <span>Har du en konto? <button className="text-[#FF6319] underline" onClick={() => setMode("login")}>Log ind</button></span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
