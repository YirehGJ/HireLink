
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
import { DeleteAccountSection } from "./delete-account";

const accountFormSchema = z
  .object({
    fullName: z.string().trim().min(2, { message: "El nombre debe tener al menos 2 caracteres." }).max(120, { message: "El nombre no puede pasar de 120 caracteres." }),
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
  const { user, setUser, isMounted, readOnly } = useApp();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // Las cuentas creadas con Google no tienen contraseña propia en HireLink.
  const hasPasswordLogin = !!auth?.currentUser?.providerData.some((p) => p.providerId === "password");

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
    // En «Ver como» (solo lectura) la administradora no puede cambiar la cuenta que está observando.
    if (readOnly) return;
    setIsSubmitting(true);

    if (!auth?.currentUser || !firestore || !user) {
      toast({ title: "Error", description: "No se pudo actualizar el perfil.", variant: "destructive"});
      setIsSubmitting(false);
      return;
    }

    try {
      const updates: Promise<any>[] = [];
      const updatedUserData: any = {};
      const changingPassword = hasPasswordLogin && !!data.newPassword && !!data.currentPassword;

      // Primero se verifica la contraseña actual: si es incorrecta no se aplica ningún cambio
      // (antes se guardaba el nombre y luego se avisaba del error de contraseña).
      if (changingPassword) {
        const credential = EmailAuthProvider.credential(user.email, data.currentPassword!);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      // Update display name if changed
      if (data.fullName !== user.fullName) {
        updates.push(updateProfile(auth.currentUser, { displayName: data.fullName }));
        updates.push(updateDoc(doc(firestore, "users", user.id), { fullName: data.fullName }));
        // El nombre que ven las reclutadoras vive en el perfil de la candidata: se mantiene al día (si aún no hay perfil, no pasa nada).
        if (user.role === "candidate") {
          updates.push(updateDoc(doc(firestore, "candidates", user.id), { fullName: data.fullName }).catch(() => {}));
        }
        updatedUserData.fullName = data.fullName;
      }

      await Promise.all(updates);

      if (changingPassword) {
        await updatePassword(auth.currentUser, data.newPassword!);
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
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-md font-medium text-foreground">Perfil</h3>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Tu nombre y apellido" {...field} disabled={readOnly} />
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

        <h3 className="text-md font-medium text-foreground">Cambiar Contraseña</h3>
        {hasPasswordLogin ? (
          <>
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña Actual</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" autoComplete="current-password" {...field} />
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
                    <Input type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" {...field} />
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
                    <Input type="password" placeholder="Repite la nueva contraseña" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Iniciaste sesión con tu cuenta de Google, por lo que la contraseña se administra desde Google y no desde HireLink.
          </p>
        )}
        <Button type="submit" disabled={isSubmitting || readOnly}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </form>
    </Form>
    <DeleteAccountSection />
    </>
  );
}
