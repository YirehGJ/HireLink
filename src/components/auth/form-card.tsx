import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import Link from "next/link";

interface FormCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

export function FormCard({ title, description, children, footerContent }: FormCardProps) {
  return (
    <main id="contenido" tabIndex={-1} className="flex min-h-svh items-center justify-center p-4 sm:p-6 focus:outline-none">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" aria-label="HireLink, ir al inicio" className="flex justify-center items-center gap-2 mb-4">
            <Icons.logo className="h-8 w-8 text-primary" />
          </Link>
          <CardTitle as="h1">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
          {footerContent && (
              <div className="mt-6 text-center text-sm">
                  {footerContent}
              </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
