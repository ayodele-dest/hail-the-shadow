import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function ShadowParticles({ count = 3000 }) {
    const ref = useRef<THREE.Points>(null)

    const [positions, sizes] = useMemo(() => {
        const pos = new Float32Array(count * 3)
        const siz = new Float32Array(count)
        for (let i = 0; i < count; i++) {
            // Sphere distribution around the mask
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            const r = 3 + Math.random() * 6
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
            pos[i * 3 + 2] = r * Math.cos(phi)
            siz[i] = Math.random() * 0.015 + 0.003
        }
        return [pos, siz]
    }, [count])

    useFrame((state) => {
        if (!ref.current) return
        ref.current.rotation.y = state.clock.elapsedTime * 0.012
        ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.05
    })

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-size"
                    count={count}
                    array={sizes}
                    itemSize={1}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.018}
                color="#4a2060"
                sizeAttenuation
                transparent
                opacity={0.4}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}
