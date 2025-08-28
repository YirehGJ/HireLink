
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/auth/form-card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useApp } from "@/components/providers/app-provider";
import { users } from "@/lib/data";

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es requerido." })
    .email({ message: "Formato de email inválido." }),
  password: z
    .string()
    .min(1, { message: "La contraseña es requerida." })
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  rememberMe: z.boolean().default(false).optional(),
});


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setUser } = useApp();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate error
    if (values.email === "error@example.com") {
        toast({
            title: "Error de autenticación",
            description: "Credenciales inválidas. Por favor, inténtalo de nuevo.",
            variant: "destructive"
        });
        setIsSubmitting(false);
        return;
    }
    
    const loggedInUser = users.find(u => u.email === values.email);

    if (!loggedInUser) {
        toast({
            title: "Error de autenticación",
            description: "No se encontró ningún usuario con ese correo.",
            variant: "destructive"
        });
        setIsSubmitting(false);
        return;
    }

    setUser(loggedInUser);

    toast({
      title: "Inicio de sesión exitoso",
      description: "Redirigiendo a tu panel...",
    });

    router.push("/dashboard");
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </Form>
    </FormCard>
  );
}
