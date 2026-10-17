"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React from "react";
import { Loader2, MailCheck } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/auth/form-card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El email es requerido." })
    .email({ message: "Formato de email inválido." }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) return;
    setIsSubmitting(true);
    try {
      // El correo de Firebase sale en español.
      auth.languageCode = "es";
      await sendPasswordResetEmail(auth, values.email.trim());
      setSentTo(values.email.trim());
    } catch (error: any) {
      const code = error?.code as string | undefined;
      if (code === "auth/user-not-found") {
        // Mismo mensaje que si existiera: no se revela qué correos tienen cuenta.
        setSentTo(values.email.trim());
      } else if (code === "auth/too-many-requests") {
        toast({
          title: "Demasiados intentos",
          description: "Espera unos minutos antes de solicitar otro correo.",
          variant: "destructive",
        });
      } else if (code === "auth/invalid-email") {
        form.setError("email", { message: "Formato de email inválido." });
      } else {
        console.error("Password reset error:", error);
        toast({
          title: "No se pudo enviar el correo",
          description: "Revisa tu conexión e inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormCard
      title="Recuperar Contraseña"
      description="Ingresa tu email para recibir instrucciones y reestablecerla."
      footerContent={
        <Button variant="link" asChild className="h-auto px-0 py-1.5 font-semibold">
            <Link href="/login">Volver a inicio de sesión</Link>
        </Button>
      }
    >
      {sentTo ? (
        <div className="space-y-3 text-center" role="status">
          <MailCheck className="mx-auto h-10 w-10 text-primary" />
          <p className="font-medium">Revisa tu correo</p>
          <p className="text-sm text-muted-foreground">
            Si existe una cuenta con <span className="font-medium text-foreground">{sentTo}</span>, recibirás un
            enlace para reestablecer tu contraseña. Si no lo ves en unos minutos, revisa la carpeta de spam.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSentTo(null)}>Usar otro correo</Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="tu@email.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar correo
            </Button>
          </form>
        </Form>
      )}
    </FormCard>
  );
}
