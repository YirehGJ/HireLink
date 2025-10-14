
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React, { Suspense } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/auth/form-card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/icons";
import { Separator } from "@/components/ui/separator";

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
  const [isGoogleSubmitting, setIsGoogleSubmitting] = React.useState(false);

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
    if (!auth) {
        toast({
            title: "Error de configuración",
            description: "Los servicios de Firebase no están disponibles.",
            variant: "destructive"
        });
        setIsSubmitting(false);
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, values.email, values.password);

        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada. Por favor, inicia sesión.",
        });

        router.push("/login");

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
        // Create profile only if it doesn't exist
        const newUserProfile = {
          id: googleUser.uid,
          email: googleUser.email!,
          fullName: googleUser.displayName || "Usuario de Google",
          role: 'candidate' as const, // Default role for Google sign-up
          status: 'active' as const,
        };
        
        await setDoc(userDocRef, newUserProfile);
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
              <Button type="submit" className="w-full" disabled={isSubmitting || isGoogleSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear cuenta
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
                <Icons.google className="mr-2 h-4 w-4" />
            )}{' '}
            Google
        </Button>
      </div>
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
