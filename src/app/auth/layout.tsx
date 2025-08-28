import Link from 'next/link';
import { Icons } from '@/components/icons';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-card/50 p-4">
      <div className="absolute left-4 top-4 md:left-8 md:top-8">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <Icons.logo className="h-8 w-8" />
          <span className="text-2xl font-bold font-headline tracking-tighter">
            HireLink
          </span>
        </Link>
      </div>
      {children}
    </div>
  );
}
