
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

  // Prevents hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-5 w-5" />
      <Switch
        id="theme-switch"
        checked={isDark}
        onCheckedChange={toggleTheme}
      />
      <Moon className="h-5 w-5" />
      <Label htmlFor="theme-switch" className="sr-only">
        Cambiar entre tema claro y oscuro
      </Label>
    </div>
  )
}
