import * as z from "zod";

/**
 * Campo de correo de los formularios de acceso. Se recorta ANTES de validar: el teclado del celular suele agregar
 * un espacio al autocompletar y, sin esto, el formulario responde «Email inválido» con un correo bien escrito.
 * Sin `required`, un campo vacío muestra el mismo mensaje que un correo mal formado.
 */
export function emailField(invalid = "Email inválido", required = invalid) {
  return z.string().trim().min(1, required).email(invalid);
}
