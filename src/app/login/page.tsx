
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/auth/form-card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, useFirestore } from "@/firebase";
import { Icons } from "@/components/icons";
import { userService } from "@/firebase/firestore/user-service";

const loginSchema = z.object({
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida").min(6, "Mínimo 6 caracteres"),
  rememberMe: z.boolean().default(false),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [loadingType, setLoadingType] = React.useState<'email' | 'google' | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const handleAuthError = (error: any) => {
    console.error("Auth Error:", error);
    toast({
      title: "Error de acceso",
      description: "Credenciales inválidas o problema de conexión.",
      variant: "destructive"
    });
  };

  async function onEmailLogin(values: LoginValues) {
    if (!auth || !firestore) return;
    setLoadingType('email');
    
    try {
      const { user } = await signInWithEmailAndPassword(auth, values.email, values.password);
      await userService.ensureProfileExists(firestore, user.uid, user.email!, user.displayName || values.email.split('@')[0]);
      router.push("/dashboard");
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoadingType(null);
    }
  }

  async function onGoogleLogin() {
    if (!auth || !firestore) return;
    setLoadingType('google');

    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      await userService.ensureProfileExists(firestore, user.uid, user.email!, user.displayName || "Usuario Google");
      router.push("/dashboard");
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoadingType(null);
    }
  }

  return (
    <FormCard
      title="Iniciar Sesión"
      description="Bienvenido de nuevo a HireLink."
      footerContent={
        <>
          ¿Aún no tienes cuenta?{' '}
          <Button variant="link" asChild className="p-0 h-auto font-semibold">
            <Link href="/register">Regístrate</Link>
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onEmailLogin)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="tu@email.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showPassword ? 'text' : 'password'} placeholder="********" {...field} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal text-xs">Recuérdame</FormLabel>
                  </FormItem>
                )}
              />
              <Button variant="link" asChild className="p-0 h-auto text-xs"><Link href="/forgot-password">¿Olvidaste tu contraseña?</Link></Button>
            </div>
            <Button type="submit" className="w-full" disabled={!!loadingType}>
              {loadingType === 'email' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </Form>
        <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">O continúa con</span></div></div>
        <Button variant="outline" className="w-full" onClick={onGoogleLogin} disabled={!!loadingType}>
          {loadingType === 'google' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Icons.google className="mr-2 h-4 w-4" />}
          Google
        </Button>

      </div>
    </FormCard>
  );
}
