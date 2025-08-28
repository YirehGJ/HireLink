import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Briefcase, Users, BrainCircuit } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Icons.logo className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold font-headline tracking-tighter">
              HireLink
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Registrarse</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tighter text-foreground">
              Conectamos Talento con Oportunidades, <br/> con el Poder de la IA Explicable
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              HireLink es la plataforma líder que utiliza inteligencia artificial para analizar perfiles, recomendar vacantes y transparentar el porqué de cada recomendación.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">Encontrar mi próximo empleo</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register?role=recruiter">Contratar al mejor talento</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-card/50 py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">¿Por qué HireLink?</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Una plataforma inteligente diseñada para candidatos y reclutadores.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center border-0 md:border shadow-none md:shadow-sm">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                    <BrainCircuit className="h-8 w-8" />
                  </div>
                  <CardTitle className="mt-4 font-headline">IA Explicable</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    No más dudas. Entiende por qué una vacante es perfecta para ti con análisis claros y transparentes.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="text-center border-0 md:border shadow-none md:shadow-sm">
                <CardHeader>
                  <div className="mx-auto bg-accent/10 text-accent p-3 rounded-full w-fit">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <CardTitle className="mt-4 font-headline">Para Candidatos</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Sube tu CV, obtén un perfil de habilidades automático y recibe recomendaciones de empleo personalizadas.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="text-center border-0 md:border shadow-none md:shadow-sm">
                <CardHeader>
                  <div className="mx-auto bg-purple-500/10 text-purple-500 p-3 rounded-full w-fit">
                    <Users className="h-8 w-8" />
                  </div>
                  <CardTitle className="mt-4 font-headline">Para Reclutadores</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Publica vacantes y recibe una lista de candidatos filtrados por IA, con un puntaje de afinidad y razones detalladas.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} HireLink. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
