import type { MetadataRoute } from "next";

/** Los buscadores pueden leer la portada y las páginas de acceso, pero no el panel (privado) ni la API. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/api"] }],
  };
}
