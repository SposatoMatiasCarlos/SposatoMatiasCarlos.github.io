import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor, Preload } from '@react-three/drei';

// Wrapper riutilizzabile per ogni scena 3D del sito.
// - abbassa la risoluzione se il dispositivo fatica (mobile), la alza se va bene
// - Suspense: i figli possono caricare modelli/texture con useGLTF, useTexture…
//
// Uso:
//   <Scene camera={{ position: [0, 0, 6] }}>
//     <mesh>…</mesh>
//   </Scene>
function Scene({ children, camera = { position: [0, 0, 8], fov: 45 }, ...props }) {
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas camera={camera} dpr={dpr} {...props}>
      <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} />
      <Suspense fallback={null}>
        {children}
        <Preload all />
      </Suspense>
    </Canvas>
  );
}

export default Scene;
