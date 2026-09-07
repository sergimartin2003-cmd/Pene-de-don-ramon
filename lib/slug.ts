export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function uniqueSlug(base: string, taken: string[]): string {
  const root = slugify(base) || "producto";
  if (!taken.includes(root)) return root;
  let n = 2;
  while (taken.includes(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}
