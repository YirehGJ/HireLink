
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React, { Suspense } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";


import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/auth/form-card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const formSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Formato de email inválido." }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  role: z.enum(["candidate", "recruiter", "admin"], {
    required_error: "Debes seleccionar un tipo de cuenta.",
  }),
});

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const defaultRole = searchParams.get("role") === "recruiter" ? "recruiter" : "candidate";
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: defaultRole,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (!auth || !firestore) {
        toast({
            title: "Error de configuración",
            description: "Los servicios de Firebase no están disponibles.",
            variant: "destructive"
        });
        setIsSubmitting(false);
        return;
    }

    try {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const firebaseUser = userCredential.user;

        // 2. Create user profile in Firestore
        const userProfile = {
            id: firebaseUser.uid,
            email: values.email,
            fullName: values.fullName,
            role: values.role,
            status: 'active' as const,
            organizationRef: values.role === 'recruiter' ? 'org-1' : undefined,
        };
        
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        
        setDoc(userDocRef, userProfile).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'create',
              requestResourceData: userProfile,
            });
            errorEmitter.emit('permission-error', permissionError);
        });


        toast({
          title: "Registro exitoso",
          description: "¡Bienvenido a HireLink! Redirigiendo...",
        });

        router.push("/dashboard");

    } catch (error: any) {
        console.error("Firebase Registration Error:", error);
        let description = "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.";
        if (error.code === 'auth/email-already-in-use') {
            description = "Este correo electrónico ya está en uso. Por favor, inicia sesión o usa otro correo.";
        }
        toast({
            title: "Error de registro",
            description,
            variant: "destructive"
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <FormCard
      title="Crear una cuenta"
      description="Únete a la plataforma líder en gestión de talento."
      footerContent={
        <>
          ¿Ya tienes una cuenta?{' '}
           <Button variant="link" asChild className="p-0 h-auto font-semibold">
            <Link href="/login">Inicia sesión</Link>
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
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
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
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
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de cuenta</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Busco empleo o busco contratar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="candidate">
                      Soy un candidato (busco empleo)
                    </SelectItem>
                    <SelectItem value="recruiter">
                      Soy un reclutador (busco talento)
                    </SelectItem>
                     <SelectItem value="admin">
                      Soy administrador
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear cuenta
          </Button>
        </form>
      </Form>
    </FormCard>
  );
}


function RegisterPageLoading() {
  return (
    <FormCard
      title="Crear una cuenta"
      description="Únete a la plataforma líder en gestión de talento."
      footerContent={
        <>
          ¿Ya tienes una cuenta?{' '}
           <Button variant="link" asChild className="p-0 h-auto font-semibold">
            <Link href="/login">Inicia sesión</Link>
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24"/>
          <Skeleton className="h-10 w-full"/>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24"/>
          <Skeleton className="h-10 w-full"/>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24"/>
          <Skeleton className="h-10 w-full"/>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24"/>
          <Skeleton className="h-10 w-full"/>
        </div>
        <Skeleton className="h-10 w-full"/>
      </div>
    </FormCard>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageLoading />}>
      <RegisterPageContent />
    </Suspense>
  )
}

    