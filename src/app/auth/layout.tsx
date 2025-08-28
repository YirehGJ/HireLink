import Link from 'next/link';
import { Icons } from '@/components/icons';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
        <main className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto">
                <div className="flex justify-center mb-6">
                    <Link href="/" className="flex items-center gap-2 text-foreground">
                        <Icons.logo className="h-8 w-8 text-primary" />
                        <span className="text-2xl font-bold font-headline tracking-tighter">
                            HireLink
                        </span>
                    </Link>
                </div>
                {children}
            </div>
        </main>
        <aside className="hidden md:flex flex-1 items-center justify-center p-8 bg-muted/50">
            <Image 
                data-ai-hint="abstract illustration"
                src="https://picsum.photos/seed/hirelink-auth/800/1000"
                alt="Abstract illustration"
                width={800}
                height={1000}
                className="rounded-2xl object-cover w-full h-full max-h-[90vh] max-w-2xl"
            />
        </aside>
    </div>
  );
}
