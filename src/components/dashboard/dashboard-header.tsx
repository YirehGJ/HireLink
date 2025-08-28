interface DashboardHeaderProps {
  greeting: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function DashboardHeader({
  greeting,
  title,
  description,
  actions,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
