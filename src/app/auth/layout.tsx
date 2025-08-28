import Link from 'next/link';
import { Icons } from '@/components/icons';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-card/50 p-4">
      <div className="mb-8">
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
