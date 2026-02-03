'use client';

import { OrbitControls, Environment, Grid } from '@react-three/drei';

export function Scene3D() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
      <pointLight position={[0, 0, 0]} intensity={0.3} />

      {/* Environment */}
      <Environment preset="city" />

      {/* Grid helper */}
      <Grid
        args={[200, 200]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#374151"
        sectionSize={20}
        sectionThickness={1}
        sectionColor="#4b5563"
        fadeDistance={400}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      {/* Camera controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        panSpeed={0.5}
        minDistance={10}
        maxDistance={500}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}
