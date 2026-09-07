"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { buildShoeGeometry, createMaterialNormalMap } from "@/lib/shoe-geometry";
import { extractSilhouette } from "@/lib/silhouette";

type Props = {
  images: { url: string; alt: string }[];
  depth: number;
  tolerance: number;
  sourceIndex: number;
  source: "auto" | "glb";
  glbUrl: string | null;
  className?: string;
};

type Build = {
  geometry: THREE.ExtrudeGeometry;
  materials: THREE.Material[];
  cropped: boolean;
  /** Escala que encuadra el modelo igual venga de la foto que venga. */
  fit: number;
};

function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        resolve(texture);
      },
      undefined,
      () => reject(new Error(`No se ha podido cargar la textura: ${url}`)),
    );
  });
}

function GlbModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={cloned} />;
}

export default function Product3DViewer({
  images,
  depth,
  tolerance,
  sourceIndex,
  source,
  glbUrl,
  className = "",
}: Props) {
  const [build, setBuild] = useState<Build | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [spin, setSpin] = useState(true);
  const [active, setActive] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  useEffect(() => {
    setCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const front = images[Math.min(sourceIndex, Math.max(0, images.length - 1))] ?? images[0];
  const back = images.find((image) => image.url !== front?.url) ?? front;

  useEffect(() => {
    if (source === "glb" || !front?.url) return;

    let cancelled = false;
    let created: Build | null = null;
    setStatus("loading");

    (async () => {
      try {
        const silhouette = await extractSilhouette(front.url, tolerance);
        const [frontMap, backMap] = await Promise.all([
          loadTexture(front.url),
          loadTexture(back.url),
        ]);
        if (cancelled) {
          frontMap.dispose();
          backMap.dispose();
          return;
        }

        // La cara trasera se ve en espejo desde detrás: se invierte la textura.
        backMap.wrapS = THREE.RepeatWrapping;
        backMap.repeat.x = -1;
        backMap.offset.x = 1;

        const { geometry, fit } = buildShoeGeometry(
          silhouette.contour,
          silhouette.aspect,
          depth,
        );
        const material = createMaterialNormalMap();
        const normalScale = new THREE.Vector2(0.32, 0.32);

        const materials: THREE.Material[] = [
          new THREE.MeshStandardMaterial({
            map: frontMap,
            roughness: 0.82,
            metalness: 0,
            normalMap: material,
            normalScale,
          }),
          new THREE.MeshStandardMaterial({
            map: backMap,
            roughness: 0.86,
            metalness: 0,
            normalMap: material,
            normalScale,
          }),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(silhouette.averageColor).multiplyScalar(0.82),
            roughness: 0.95,
            metalness: 0,
            normalMap: material,
            normalScale: new THREE.Vector2(0.5, 0.5),
          }),
        ];

        created = { geometry, materials, cropped: silhouette.cropped, fit };
        setBuild(created);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      // Liberar GPU al cambiar de producto o de ajustes.
      created?.geometry.dispose();
      created?.materials.forEach((material) => {
        const standard = material as THREE.MeshStandardMaterial;
        standard.map?.dispose();
        standard.normalMap?.dispose();
        material.dispose();
      });
    };
  }, [front?.url, back?.url, depth, tolerance, source]);

  const resetView = () => {
    controlsRef.current?.reset();
  };

  const interactive = !coarsePointer || active;
  const usingGlb = source === "glb" && Boolean(glbUrl);

  if (!front?.url && !usingGlb) {
    return (
      <div className={`grid place-items-center bg-sand/60 p-8 text-center ${className}`}>
        <p className="text-sm text-stone">Sube al menos una foto para generar el modelo 3D.</p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[radial-gradient(120%_100%_at_50%_0%,#f7f3ec_0%,#e2dacb_100%)] ${className}`}>
      {status === "loading" && !usingGlb && (
        <div className="absolute inset-0 z-20 grid place-items-center">
          <div className="flex flex-col items-center gap-3">
            <span className="block h-7 w-7 animate-spin rounded-full border-2 border-ink/15 border-t-ember" />
            <p className="label text-stone">Reconstruyendo la pieza</p>
          </div>
        </div>
      )}

      {status === "error" && !usingGlb && (
        <div className="absolute inset-0 z-20 grid place-items-center p-8 text-center">
          <p className="max-w-xs text-sm text-stone">
            No se ha podido generar el 3D con esta foto. Prueba con una imagen de fondo liso.
          </p>
        </div>
      )}

      {(build || usingGlb) && (
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          camera={{ position: [0, 0.05, 2.3], fov: 35 }}
          style={{ touchAction: interactive ? "none" : "pan-y" }}
        >
          <ambientLight intensity={0.85} />
          <directionalLight
            position={[2.4, 3.2, 3.6]}
            intensity={2.1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-3.2, 1.4, 2]} intensity={0.65} color="#ccd6e6" />
          <pointLight position={[0, -1.6, -2.6]} intensity={7} color="#c0451d" distance={7} />

          <group position={[0, 0.06, 0]}>
            {usingGlb ? (
              <Suspense fallback={null}>
                <GlbModel url={glbUrl as string} />
              </Suspense>
            ) : (
              build && (
                <mesh
                  geometry={build.geometry}
                  material={build.materials}
                  scale={build.fit * 0.92}
                  castShadow
                  receiveShadow
                />
              )
            )}
          </group>

          <ContactShadows
            position={[0, -0.78, 0]}
            opacity={0.34}
            scale={3.4}
            blur={2.8}
            far={1.4}
            color="#3a3128"
          />

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enabled={interactive}
            autoRotate={spin}
            autoRotateSpeed={1.15}
            enableDamping
            dampingFactor={0.06}
            minDistance={1.5}
            maxDistance={3.4}
            minPolarAngle={Math.PI * 0.16}
            maxPolarAngle={Math.PI * 0.84}
          />
        </Canvas>
      )}

      {/* En móvil el lienzo no captura el dedo hasta que se activa, para no bloquear el scroll. */}
      {coarsePointer && !active && (build || usingGlb) && (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="absolute inset-0 z-10 flex items-end justify-center pb-6"
          aria-label="Activar el giro con el dedo"
        >
          <span className="label bg-ink/85 px-4 py-2.5 text-bone backdrop-blur">
            Toca para girar
          </span>
        </button>
      )}

      {(build || usingGlb) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 p-3">
          <span className="label hidden bg-bone/70 px-2.5 py-1.5 text-stone backdrop-blur sm:inline-block">
            {coarsePointer ? "Arrastra para girar" : "Arrastra · rueda para acercar"}
          </span>
          <div className="pointer-events-auto ml-auto flex gap-2">
            {coarsePointer && active && (
              <button
                type="button"
                onClick={() => setActive(false)}
                className="label bg-bone/85 px-3 py-2 text-ink backdrop-blur transition-colors hover:bg-bone"
              >
                Soltar
              </button>
            )}
            <button
              type="button"
              onClick={() => setSpin((value) => !value)}
              className="label bg-bone/85 px-3 py-2 text-ink backdrop-blur transition-colors hover:bg-bone"
              aria-pressed={spin}
            >
              {spin ? "Pausar" : "Girar"}
            </button>
            <button
              type="button"
              onClick={resetView}
              className="label bg-bone/85 px-3 py-2 text-ink backdrop-blur transition-colors hover:bg-bone"
            >
              Centrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
