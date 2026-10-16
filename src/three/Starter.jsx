import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Scena minima da copiare quando si parte con una nuova idea:
// luci, un oggetto animato ogni frame e i controlli per girarci intorno.
// Da usare dentro <Scene>.
function Starter() {
  const cube = useRef();

  // useFrame gira a ogni frame: delta = secondi dall'ultimo frame
  useFrame((_, delta) => {
    cube.current.rotation.x += delta * 0.5;
    cube.current.rotation.y += delta * 0.8;
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 2]} intensity={2} />

      <mesh ref={cube}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#5f5bf2" roughness={0.3} />
      </mesh>

      <OrbitControls enableDamping />
    </>
  );
}

export default Starter;
