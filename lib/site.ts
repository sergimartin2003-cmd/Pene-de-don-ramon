/**
 * Datos de la marca. Todo lo que hay que tocar para renombrar la tienda,
 * cambiar el correo de contacto o el WhatsApp está en este fichero.
 */
export const site = {
  name: "DON RAMÓN",
  shortName: "D·R",
  tagline: "Estudio de ropa",
  claim: "Prendas honestas, hechas en tiradas cortas.",
  description:
    "Estudio de ropa de calle con acabado premium. Tiradas cortas, tejidos con peso y patrones que aguantan el uso diario.",
  url: "https://donramon.example",
  email: "hola@donramon.example",
  whatsapp: "+34600000000",
  instagram: "https://instagram.com",
  city: "Barcelona",
  address: "Carrer de la Riera Baixa 14, Barcelona",
  hours: "Martes a sábado, 11:00 – 20:30",
  since: 2021,
} as const;

/** Mensaje precargado para consultar por una prenda (no hay carrito). */
export function whatsappLink(productName?: string, size?: string): string {
  const digits = site.whatsapp.replace(/[^0-9]/g, "");
  const text = productName
    ? `Hola, me interesa la pieza "${productName}"${size ? ` en talla ${size}` : ""}. ¿Sigue disponible?`
    : "Hola, quería preguntaros por una pieza.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function mailtoLink(productName?: string, size?: string): string {
  const subject = productName ? `Consulta: ${productName}` : "Consulta";
  const body = productName
    ? `Hola,\n\nMe interesa la pieza "${productName}"${size ? ` en talla ${size}` : ""}.\n¿Sigue disponible?\n\nGracias.`
    : "Hola,\n\nQuería preguntaros por una pieza.\n\nGracias.";
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
