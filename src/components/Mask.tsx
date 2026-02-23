import { useRef, useEffect, useCallback } from 'react'
import { useGLTF, Center, ContactShadows } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'

useGLTF.preload('/models/mask.glb')

interface MaskProps {
    onReady?: () => void
}

export default function Mask({ onReady }: MaskProps) {
    const { scene } = useGLTF('/models/mask.glb')
    const groupRef = useRef<THREE.Group>(null)
    const innerRef = useRef<THREE.Group>(null)
    const { viewport } = useThree()

    // Mouse tracking state (using refs to avoid re-renders every frame)
    const mouse = useRef({ x: 0, y: 0 })
    const smoothMouse = useRef({ x: 0, y: 0 })
    const introComplete = useRef(false)

    // Track mouse position normalised to -1..1
    const handlePointerMove = useCallback((e: PointerEvent) => {
        mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
        mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }, [])

    useEffect(() => {
        window.addEventListener('pointermove', handlePointerMove)
        return () => window.removeEventListener('pointermove', handlePointerMove)
    }, [handlePointerMove])

    // ── GSAP intro animation: mask emerges from the deep background ──
    useEffect(() => {
        if (!groupRef.current) return

        const group = groupRef.current

        // Initial state: pushed far back, scaled down, invisible (merged with bg)
        gsap.set(group.position, { z: -12 })
        gsap.set(group.scale, { x: 0.3, y: 0.3, z: 0.3 })
        gsap.set(group.rotation, { x: 0.4 })

        // Small delay then emerge
        const tl = gsap.timeline({
            delay: 0.8,
            onComplete: () => {
                introComplete.current = true
                onReady?.()
            },
        })

        // Phase 1: emerge from deep background (like materialising from shadow)
        tl.to(group.position, {
            z: 0,
            duration: 2.8,
            ease: 'power3.out',
        })
            .to(
                group.scale,
                {
                    x: 1,
                    y: 1,
                    z: 1,
                    duration: 2.8,
                    ease: 'power3.out',
                },
                '<' // same start
            )
            .to(
                group.rotation,
                {
                    x: 0,
                    duration: 2.4,
                    ease: 'power2.out',
                },
                '<0.2'
            )

        return () => {
            tl.kill()
        }
    }, [onReady])

    // ── Per-frame: smooth mouse tracking + idle breathing ──
    useFrame((state) => {
        if (!groupRef.current || !innerRef.current) return

        // Smooth lerp towards mouse position
        const lerpFactor = 0.04
        smoothMouse.current.x += (mouse.current.x - smoothMouse.current.x) * lerpFactor
        smoothMouse.current.y += (mouse.current.y - smoothMouse.current.y) * lerpFactor

        if (introComplete.current) {
            // Mouse-reactive rotation (the mask "looks" at the cursor)
            const rotY = smoothMouse.current.x * 0.35
            const rotX = -smoothMouse.current.y * 0.2

            innerRef.current.rotation.y = rotY
            innerRef.current.rotation.x = rotX

            // Subtle positional parallax shift
            innerRef.current.position.x = smoothMouse.current.x * 0.15 * viewport.width * 0.05
            innerRef.current.position.y = smoothMouse.current.y * 0.08

            // Idle breathing float
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.06
        }
    })

    return (
        <group ref={groupRef}>
            <group ref={innerRef}>
                <Center>
                    <primitive
                        object={scene}
                        scale={1.6}
                        position={[0, 0, 0]}
                    />
                </Center>
            </group>
            <ContactShadows
                position={[0, -2.2, 0]}
                opacity={0.5}
                scale={8}
                blur={3}
                far={6}
                color="#1a0a2e"
            />
        </group>
    )
}
