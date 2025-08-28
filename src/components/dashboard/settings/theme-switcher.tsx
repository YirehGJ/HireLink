
'use client'

import { ThemeSwitcher as GenericThemeSwitcher } from '@/components/theme-switcher'

export function ThemeSwitcher() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center sm:justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
            <h3 className="text-base font-semibold">Tema de la Interfaz</h3>
            <p className="text-sm text-muted-foreground">Alterna entre el modo claro y oscuro.</p>
        </div>
        <GenericThemeSwitcher />
    </div>
  )
}
