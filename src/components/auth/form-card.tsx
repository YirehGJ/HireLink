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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <Link href="/" className="flex justify-center items-center gap-2 mb-4">
          <Icons.logo className="h-8 w-8 text-primary" />
        </Link>
        <CardTitle>{title}</CardTitle>
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
  );
}
