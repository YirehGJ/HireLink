import * as React from "react";

interface AutoFocusProps {
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
}

/**
 * Devuelve el foco a quien abrió un diálogo o un panel cuando se cierra.
 *
 * Radix solo lo hace si el diálogo se abrió con su propio `*Trigger`. En esta aplicación varios se abren con un botón
 * normal que cambia un estado (los detalles del candidato, el menú del celular, las confirmaciones) y, al cerrarlos, el
 * foco se perdía en <body>: quien navega con teclado o con lector de pantalla tenía que recorrer otra vez toda la página.
 *
 * `onOpenAutoFocus` se dispara cuando el contenido se monta y todavía no movió el foco, así que `activeElement` sigue
 * siendo el botón que lo abrió. Si ese botón ya no existe, se deja el comportamiento de Radix.
 */
export function useRestoreFocus({ onOpenAutoFocus, onCloseAutoFocus }: AutoFocusProps) {
  const opener = React.useRef<HTMLElement | null>(null);

  return {
    onOpenAutoFocus: (event: Event) => {
      opener.current = document.activeElement as HTMLElement | null;
      onOpenAutoFocus?.(event);
    },
    onCloseAutoFocus: (event: Event) => {
      onCloseAutoFocus?.(event);
      if (event.defaultPrevented) return;
      const el = opener.current;
      if (el && el !== document.body && document.contains(el)) {
        event.preventDefault();
        el.focus();
      }
    },
  };
}
