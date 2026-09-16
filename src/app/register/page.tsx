
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React, { Suspense } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/auth/form-card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/icons";
import { userService } from "@/firebase/firestore/user-service";

const registerSchema = z.object({
  fullName: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.enum(["candidate", "recruiter"], {
    required_error: "Selecciona un tipo de cuenta",
  }),
});

type RegisterValues = z.infer<typeof registerSchema>;

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const defaultRole = searchParams.get("role") === "recruiter" ? "recruiter" : "candidate";
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", role: defaultRole as any },
  });

  async function onRegister(values: RegisterValues) {
    if (!auth || !firestore) return;
    setLoading(true);

    try {
      const { user } = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(user, { displayName: values.fullName });
      await userService.ensureProfileExists(firestore, user.uid, values.email, values.fullName, values.role);

      toast({ title: "¡Cuenta creada!", description: "Bienvenido a HireLink." });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Register Error:", error);
      toast({
        title: "Error de registro",
        description: error.code === 'auth/email-already-in-use' ? "Email ya registrado." : "Inténtalo de nuevo.",
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
      footerContent={<>¿Ya tienes cuenta? <Button variant="link" asChild className="p-0 h-auto"><Link href="/login">Inicia sesión</Link></Button></>}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onRegister)} className="space-y-4">
          <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem><FormLabel>Nombre completo</FormLabel><FormControl><Input placeholder="Juan Pérez" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="********" {...field} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>}>
      <RegisterPageContent />
    </Suspense>
  )
}
