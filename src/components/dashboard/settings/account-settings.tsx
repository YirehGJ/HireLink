
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { Loader2 } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const accountFormSchema = z
  .object({
    fullName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
    email: z.string().email({ message: "Formato de email inválido." }),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => {
    // Si se está cambiando la contraseña, todos los campos de contraseña son requeridos
    if (data.newPassword || data.confirmPassword || data.currentPassword) {
      return !!data.currentPassword && !!data.newPassword && !!data.confirmPassword;
    }
    return true;
  }, {
    message: "Por favor, completa todos los campos de contraseña para cambiarla.",
    path: ["currentPassword"],
  })
  .refine((data) => {
    if (data.newPassword && data.newPassword.length > 0 && data.newPassword.length < 8) {
      return false;
    }
    return true;
  },{
    message: "La nueva contraseña debe tener al menos 8 caracteres.",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las nuevas contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountSettings() {
  const { user, isMounted } = useApp();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName,
        email: user.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [user, form]);


  function onSubmit(data: AccountFormValues) {
    setIsSubmitting(true);
    console.log(data);
    setTimeout(() => {
        toast({
          title: "Cuenta actualizada",
          description: "La información de tu cuenta ha sido guardada exitosamente.",
        });
        setIsSubmitting(false);
        form.reset({
          ...form.getValues(),
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
    }, 1500)
  }

  if (!isMounted) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Separator />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h4 className="text-md font-medium text-foreground">Perfil</h4>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Tu nombre y apellido" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="tu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator className="my-6"/>

        <h4 className="text-md font-medium text-foreground">Cambiar Contraseña</h4>
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña Actual</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Nueva Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Repite la nueva contraseña" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </form>
    </Form>
  );
}
