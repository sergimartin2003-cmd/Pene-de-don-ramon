# DON RAMÓN — tienda de zapatillas

Tienda de zapatillas, sin carrito. El cliente mira el modelo, lo gira en 3D,
comprueba qué número le toca y escribe por WhatsApp o por correo. La tienda
gestiona el catálogo desde un panel propio en `/admin`.

---

## Arrancarlo

```bash
npm install
npm run dev          # http://localhost:3000
```

Para producción:

```bash
npm run build
npm start
```

La primera vez que arranca se crea `data/products.json` con ocho modelos de
ejemplo. Se pueden borrar todos desde el panel sin romper nada.

---

## El panel de administración

Está en **`/admin`** (también hay un enlace discreto, «Panel», al pie de la web).

- **Contraseña**: la variable de entorno `ADMIN_PASSWORD`. Si no defines ninguna,
  se usa `bora-admin-2026`. **Cámbiala antes de publicar la tienda.**
- La sesión es una cookie `httpOnly` firmada, válida 12 horas.
- Todas las rutas que escriben (crear, editar, borrar, subir fotos, generar texto)
  comprueban la sesión en el servidor: sin ella devuelven `401`.

Desde el panel se puede:

| | |
|---|---|
| **Añadir y quitar modelos** | Crear, editar, duplicar y borrar (con confirmación). |
| **Varias fotos** | Arrastrar o buscar en el ordenador. Se reordenan y se les pone texto alternativo. La primera manda en la parrilla. |
| **Descripción con IA** | Un botón redacta el texto a partir del nombre, la horma, el color y los materiales. |
| **Tallaje propio** | Cada modelo define sus columnas (US, UK, centímetros de pie…) y sus números, con stock por talla. Hay plantillas de tallas EU y de S/M/L. |
| **Modelo 3D** | Grosor y recorte del fondo se ajustan con vista previa en directo. |
| **Borradores** | Un modelo sin publicar sólo lo ve quien tiene la sesión abierta. |

---

## Configuración

Copia `.env.example` a `.env.local` y rellena lo que necesites:

```bash
cp .env.example .env.local
```

| Variable | Para qué sirve |
|---|---|
| `ADMIN_PASSWORD` | Contraseña del panel. |
| `ADMIN_SESSION_SECRET` | Opcional. Secreto para firmar la cookie. Si se deja vacío, se deriva de la contraseña (cambiarla cierra las sesiones abiertas). |
| `ANTHROPIC_API_KEY` | Opcional. Con clave, las descripciones las escribe Claude. Sin clave funciona igual: las compone el redactor local incluido en `lib/ai.ts`. |

Los datos de la marca (nombre, correo, WhatsApp, dirección, horario) están todos
en **`lib/site.ts`**. Es el único fichero que hay que tocar para renombrar la tienda.

---

## Cómo funciona el 3D

No se descarga ningún modelo: la zapatilla se reconstruye en el navegador a partir
de la foto que subas.

1. `lib/silhouette.ts` dibuja la foto en un canvas, estima el color del fondo con
   la mediana del marco exterior y separa la zapatilla.
2. Se queda con la mancha conectada más grande, tapa los agujeros, encoge el borde
   un píxel y traza el contorno (vecindad de Moore); después lo simplifica con
   Ramer–Douglas–Peucker.
3. `lib/garment-geometry.ts` extruye ese contorno con `ExtrudeGeometry`, proyecta
   la foto sobre la cara frontal y la segunda foto sobre la trasera, y resuelve el
   canto con el color medio del modelo y un mapa de normales de material generado
   al vuelo.
4. `components/three/Product3DViewer.tsx` lo monta con react-three-fiber: luces de
   estudio, sombra de contacto, giro automático y órbita con ratón o dedo.

**Consejos para que salga bien**: foto de perfil, fondo liso y bien contrastado con
**toda** la zapatilla, suela incluida. El fallo más típico es una suela blanca sobre
fondo blanco: el recorte se la come y el modelo sale sin suela. Si se cuela fondo,
sube el «recorte del fondo» en el panel; si desaparecen partes, bájalo. Cuando la
foto no se puede recortar con garantías, el visor no falla: usa el propio encuadre y
el modelo se sigue viendo en 3D.

¿Tienes un escaneo real? En el panel, cambia el origen del modelo a **Archivo GLB**
y pega su URL.

---

## Estructura

```
app/
  page.tsx                  portada
  tienda/                   parrilla con filtros y guía de tallas
  producto/[slug]/          ficha: fotos, 3D, tallaje y consulta
  estudio/                  sobre la tienda
  admin/                    panel (login + gestión)
  api/                      auth · products · upload · ai/description
components/
  site/                     cabecera, pie, animaciones de scroll
  product/                  tarjeta, visor de fotos, panel de tallas
  three/                    visor 3D
  admin/                    formulario, subida de fotos, tallaje, ajustes 3D
lib/
  types.ts                  modelo de datos
  store.ts                  almacén en JSON (aislado para poder cambiarlo)
  auth.ts                   sesión del panel
  ai.ts                     redacción de descripciones
  silhouette.ts             foto → contorno
  shoe-geometry.ts          contorno → malla 3D
  site.ts                   datos de la tienda
scripts/                    generación de las fotos de ejemplo
data/products.json          el catálogo
public/uploads/             las fotos subidas
```

---

## Publicarlo

El catálogo y las fotos se guardan **en disco** (`data/` y `public/uploads/`), así
que funciona tal cual en cualquier servidor Node con almacenamiento persistente:
un VPS, Railway, Render, Fly, Docker…

```bash
npm run build && npm start
```

En plataformas *serverless* con disco de sólo lectura (por ejemplo Vercel) la
tienda **no se rompe**: detecta que no puede escribir, sigue funcionando en
memoria y el panel muestra un aviso de «modo demostración». Las fotos que subas
se incrustan en el producto como data URI (máximo 1,5 MB cada una). Todo se ve y
se puede probar, pero los cambios se pierden al reiniciar el servidor.

Para que ahí sea una tienda de verdad hay que sustituir el almacén por una base
de datos: todo el acceso a disco está aislado en las funciones `readAll` y
`writeAll` de `lib/store.ts`, y las fotos se subirían a un almacenamiento de
objetos desde `app/api/upload/route.ts`. El resto del proyecto no se entera.

---

## Las fotos de ejemplo

Los ocho modelos de arranque usan ilustraciones de estudio generadas por
`scripts/generate-seed-images.mjs` (SVG, sin dependencias). Están para que la
tienda no arranque vacía: sustitúyelas por fotos reales desde el panel.

```bash
node scripts/generate-seed-images.mjs   # regenerarlas
```

---

## Accesibilidad y rendimiento

- Navegación por teclado, foco visible y enlace «saltar al contenido».
- Los filtros de la tienda son enlaces normales: funcionan sin JavaScript y se
  pueden compartir. Sin JavaScript, las animaciones de scroll no ocultan nada.
- Se respeta `prefers-reduced-motion`.
- three.js sólo se descarga cuando alguien abre la pestaña 3D.
