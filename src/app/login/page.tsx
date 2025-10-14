
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";


import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/auth/form-card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, useFirestore } from "@/firebase";
import { Icons } from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es requerido." })
    .email({ message: "Formato de email inválido." }),
  password: z
    .string()
    .min(1, { message: "La contraseña es requerida." })
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  rememberMe: z.boolean().default(false).optional(),
});


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "dev@test.com",
      password: "123456",
      rememberMe: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (!auth) {
        toast({
            title: "Error de configuración",
            description: "La autenticación de Firebase no está disponible.",
            variant: "destructive"
        });
        setIsSubmitting(false);
        return;
    }
    
    try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({
            title: "Inicio de sesión exitoso",
            description: "Redirigiendo a tu panel...",
        });
        router.push("/dashboard");
    } catch (error: any) {
        console.error("Firebase Auth Error:", error);
        toast({
            title: "Error de autenticación",
            description: "Credenciales inválidas o error de red. Por favor, inténtalo de nuevo.",
            variant: "destructive"
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleSubmitting(true);
    if (!auth || !firestore) {
        toast({ title: "Error", description: "Firebase no está configurado.", variant: "destructive" });
        setIsGoogleSubmitting(false);
        return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const userDocRef = doc(firestore, "users", googleUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const newUserProfile = {
          id: googleUser.uid,
          email: googleUser.email!,
          fullName: googleUser.displayName || "Usuario de Google",
          role: 'candidate' as const,
          status: 'active' as const,
        };
        
        setDoc(userDocRef, newUserProfile).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'create',
              requestResourceData: newUserProfile,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
      }

      toast({ title: "Inicio de sesión con Google exitoso" });
      router.push("/dashboard");

    } catch (error: any) {
      console.error("Error con Google Sign-In:", error);
      toast({ title: "Error", description: "No se pudo iniciar sesión con Google.", variant: "destructive"});
    } finally {
      setIsGoogleSubmitting(false);
    }
  }


  return (
    <FormCard
      title="Iniciar Sesión"
      description="Introduce tus credenciales para acceder a tu cuenta."
      footerContent={
        <>
          ¿No tienes cuenta?{' '}
          <Button variant="link" asChild className="p-0 h-auto font-semibold">
            <Link href="/register">Regístrate</Link>
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="tu@email.com" {...field} />
                  </FormControl>
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
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="********"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:bg-transparent"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between gap-4">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal text-sm">Recuérdame</FormLabel>
                  </FormItem>
                )}
              />
              <Button
                variant="link"
                asChild
                className="p-0 h-auto text-sm font-medium"
              >
                <Link href="/forgot-password">¿Olvidaste tu contraseña?</Link>
              </Button>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || isGoogleSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </Form>
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
            </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting || isGoogleSubmitting}>
            {isGoogleSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Icons.logo className="mr-2 h-4 w-4" />
            )}{' '}
            Google
        </Button>
      </div>
    </FormCard>
  );
}

