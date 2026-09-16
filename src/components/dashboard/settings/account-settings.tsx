
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { Loader2 } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";

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
  const { user, setUser, isMounted } = useApp();
  const auth = useAuth();
  const firestore = useFirestore();
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


  async function onSubmit(data: AccountFormValues) {
    setIsSubmitting(true);

    if (!auth?.currentUser || !firestore || !user) {
      toast({ title: "Error", description: "No se pudo actualizar el perfil.", variant: "destructive"});
      setIsSubmitting(false);
      return;
    }

    try {
      const updates: Promise<any>[] = [];
      const updatedUserData: any = {};
      
      // Update display name if changed
      if (data.fullName !== user.fullName) {
        updates.push(updateProfile(auth.currentUser, { displayName: data.fullName }));
        updates.push(updateDoc(doc(firestore, "users", user.id), { fullName: data.fullName }));
        updatedUserData.fullName = data.fullName;
      }
      
      await Promise.all(updates);

      if (data.newPassword && data.currentPassword) {
        const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, data.newPassword);
      }

      // Update local app state
      setUser(prevUser => prevUser ? { ...prevUser, ...updatedUserData } : null);

      toast({
        title: "Cuenta actualizada",
        description: "La información de tu cuenta ha sido guardada exitosamente.",
      });

    } catch (error: any) {
       console.error("Error updating profile:", error);
       const isWrongPassword = error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password';
       toast({
        title: "Error",
        description: isWrongPassword
          ? "Tu contraseña actual es incorrecta."
          : "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
        form.reset({
          ...form.getValues(),
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
    }
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
                <Input type="email" placeholder="tu@email.com" {...field} disabled />
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
