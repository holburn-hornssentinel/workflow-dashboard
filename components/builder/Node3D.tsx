'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Mesh } from 'three';
import type { Node } from '@xyflow/react';
import type { Node3DPosition } from '@/types/visualization';
import { getNodeGeometry, isConePointingDown } from '@/lib/3d/nodeGeometry';

interface Node3DProps {
  node: Node;
  position: Node3DPosition;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function Node3D({ node, position, selected, onSelect }: Node3DProps) {
  const meshRef = useRef<Mesh>(null);
  const geometry = getNodeGeometry(node.type);

  // Gentle rotation for selected nodes
  useFrame(() => {
    if (meshRef.current && selected) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const handleClick = () => {
    onSelect(node.id);
  };

  const renderGeometry = () => {
    const scale = geometry.scale;
    const isEndNode = isConePointingDown(node.type);

    switch (geometry.type) {
      case 'sphere':
        return <sphereGeometry args={[scale, 32, 32]} />;
      case 'box':
        return <boxGeometry args={[scale * 1.5, scale * 1.5, scale * 1.5]} />;
      case 'octahedron':
        return <octahedronGeometry args={[scale, 0]} />;
      case 'torus':
        return <torusGeometry args={[scale, scale * 0.4, 16, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[scale * 0.8, scale * 0.8, scale * 1.5, 32]} />;
      case 'cone':
        return <coneGeometry args={[scale, scale * 1.5, 32]} />;
      default:
        return <sphereGeometry args={[scale, 32, 32]} />;
    }
  };

  const isEndNode = isConePointingDown(node.type);

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={isEndNode ? [Math.PI, 0, 0] : [0, 0, 0]}
    >
      <mesh ref={meshRef} onClick={handleClick}>
        {renderGeometry()}
        <meshStandardMaterial
          color={geometry.color}
          emissive={selected ? geometry.color : '#000000'}
          emissiveIntensity={selected ? 0.3 : 0}
          roughness={0.5}
          metalness={0.5}
        />
      </mesh>
      <Text
        position={[0, -2, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(node.data?.label || node.id)}
      </Text>
    </group>
  );
}
