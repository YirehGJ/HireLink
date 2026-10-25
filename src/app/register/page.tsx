
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile, type User as AuthUser } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/auth/form-card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { userService } from "@/firebase/firestore/user-service";
import { clearIntentionalSignOut } from "@/lib/auth-flags";
import { emailField } from "@/lib/auth-schemas";

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Mínimo 2 caracteres").max(120, "Máximo 120 caracteres"),
  email: emailField(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.enum(["candidate", "recruiter"], {
    required_error: "Selecciona un tipo de cuenta",
  }),
});

type RegisterValues = z.infer<typeof registerSchema>;

function RegisterPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", role: "candidate" },
  });

  // «/register?role=recruiter» (desde la página principal) deja elegido el tipo de cuenta. Se lee al entrar (no al
  // dibujar) para que la página se genere como HTML estático y el formulario aparezca antes de que cargue el JS.
  // El selector se vuelve a montar con `key` en lugar de cambiarle el valor: un Select de Radix controlado que cambia
  // de valor justo al montarse manda un valor vacío al formulario («Invalid enum value»).
  const [roleFromUrl, setRoleFromUrl] = React.useState<RegisterValues["role"]>("candidate");
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("role") === "recruiter") {
      setRoleFromUrl("recruiter");
      form.setValue("role", "recruiter");
    }
  }, [form]);

  async function onRegister(values: RegisterValues) {
    if (!auth || !firestore) return;
    setLoading(true);

    let created: AuthUser | null = null;
    try {
      const { user } = await createUserWithEmailAndPassword(auth, values.email.trim(), values.password);
      created = user;
      await updateProfile(user, { displayName: values.fullName.trim() });
      await userService.ensureProfileExists(firestore, user.uid, values.email.trim(), values.fullName.trim(), values.role);
      clearIntentionalSignOut();

      toast({ title: "¡Cuenta creada!", description: "Bienvenido a HireLink." });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Register Error:", error);
      // Si la cuenta de acceso ya se creó pero faltó guardar el perfil, se deshace: de lo contrario la persona
      // quedaba con sesión y sin perfil (pantalla de carga sin fin) y no podía volver a registrarse con ese correo.
      if (created) await created.delete().catch(() => {});
      toast({
        title: "Error de registro",
        description:
          error.code === 'auth/email-already-in-use' ? "Email ya registrado."
          : error.code === 'auth/network-request-failed' ? "No hay conexión. Revisa tu internet e inténtalo de nuevo."
          : "Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormCard
      title="Únete a HireLink"
      description="Crea tu perfil y empieza hoy mismo."
      footerContent={<>¿Ya tienes cuenta? <Button variant="link" asChild className="h-auto px-0 py-1.5"><Link href="/login">Inicia sesión</Link></Button></>}
    >
      <Form {...form}>
        {/* method="post": si se envía antes de que cargue el JavaScript, la contraseña no viaja en la URL. */}
        <form onSubmit={form.handleSubmit(onRegister)} method="post" noValidate className="space-y-4">
          <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem><FormLabel>Nombre completo</FormLabel><FormControl><Input placeholder="Juan Pérez" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="tu@email.com" autoComplete="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="********" autoComplete="new-password" {...field} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="role" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de cuenta</FormLabel>
              <Select key={roleFromUrl} onValueChange={field.onChange} defaultValue={roleFromUrl}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="candidate">Candidato (Busco empleo)</SelectItem>
                  <SelectItem value="recruiter">Reclutador (Busco talento)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear cuenta</Button>
        </form>
      </Form>
    </FormCard>
  );
}

export default function RegisterPage() {
  return <RegisterPageContent />;
}
