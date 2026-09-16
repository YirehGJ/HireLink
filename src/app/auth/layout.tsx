import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-stretch">
      <main className="flex flex-1 items-center justify-center p-4 lg:p-8">
        {children}
      </main>
      <aside className="relative hidden w-1/2 flex-col items-center justify-end overflow-hidden p-12 text-white lg:flex">
         <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-secondary/60" />
        <Image
          data-ai-hint="abstract geometric"
          src="https://picsum.photos/seed/hirelink-auth-bg/1200/1200"
          alt="Abstract background"
          fill
          className="-z-10 object-cover opacity-20"
          priority
        />
        <div className="relative z-20">
          <h1 className="text-4xl font-bold font-headline tracking-tighter">Conexiones inteligentes.</h1>
          <p className="mt-2 text-lg">Descubre por qué cada oportunidad es la correcta para ti.</p>
        </div>
      </aside>
    </div>
  );
}
