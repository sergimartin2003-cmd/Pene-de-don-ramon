/**
 * Datos de la marca. Todo lo que hay que tocar para renombrar la tienda,
 * cambiar el correo de contacto o el WhatsApp está en este fichero.
 */
export const site = {
  name: "DON RAMÓN",
  shortName: "D·R",
  tagline: "Tienda de zapatillas",
  claim: "Pocos modelos, todos probados antes de entrar.",
  description:
    "Tienda de zapatillas en Barcelona. Pocos modelos elegidos a mano, con las equivalencias reales de cada número y el modelo en 3D de cada par.",
  url: "https://donramon.example",
  email: "hola@donramon.example",
  whatsapp: "+34600000000",
  instagram: "https://instagram.com",
  city: "Barcelona",
  address: "Carrer de la Riera Baixa 14, Barcelona",
  hours: "Martes a sábado, 11:00 – 20:30",
  since: 2021,
} as const;

/** Mensaje precargado para consultar por un modelo (no hay carrito). */
export function whatsappLink(productName?: string, size?: string): string {
  const digits = site.whatsapp.replace(/[^0-9]/g, "");
  const text = productName
    ? `Hola, me interesan las "${productName}"${size ? ` en el ${size}` : ""}. ¿Os queda alguna?`
    : "Hola, quería preguntaros por un modelo.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function mailtoLink(productName?: string, size?: string): string {
  const subject = productName ? `Consulta: ${productName}` : "Consulta";
  const body = productName
    ? `Hola,\n\nMe interesan las "${productName}"${size ? ` en el ${size}` : ""}.\n¿Os queda alguna?\n\nGracias.`
    : "Hola,\n\nQuería preguntaros por un modelo.\n\nGracias.";
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
