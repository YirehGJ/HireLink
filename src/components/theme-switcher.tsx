
'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'

export function ThemeSwitcher() {
  // `resolvedTheme` es el tema que realmente se ve ("light" o "dark"); `theme` puede ser "system".
  // Con el tema "system" el interruptor aparecía apagado aunque la interfaz fuera oscura y el primer
  // clic parecía no hacer nada (cambiaba de "system" a "dark", que ya era el tema visible).
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === 'dark'
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  // Prevents hydration mismatch. Se reserva el mismo espacio que ocupa el interruptor para que la barra de la página
  // principal no se mueva cuando aparece (era un salto de diseño de 0.08 en Lighthouse).
  if (!mounted) {
    return <div className="h-6 w-[100px] max-[420px]:w-11" aria-hidden="true" />
  }

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-5 w-5 max-[420px]:hidden" aria-hidden="true" />
      <Switch
        id="theme-switch"
        checked={isDark}
        onCheckedChange={toggleTheme}
      />
      <Moon className="h-5 w-5 max-[420px]:hidden" aria-hidden="true" />
      <Label htmlFor="theme-switch" className="sr-only">
        Cambiar entre tema claro y oscuro
      </Label>
    </div>
  )
}
