import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, useProgress } from '@react-three/drei'
import {
    EffectComposer,
    Bloom,
    Vignette,
    ChromaticAberration,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import gsap from 'gsap'
import Mask from './components/Mask'
import ShadowParticles from './components/ShadowParticles'

/* ── Loading screen ── */
function Loader({ onLoaded }: { onLoaded: () => void }) {
    const { progress, active } = useProgress()
    if (!active && progress === 100) {
        setTimeout(onLoaded, 400)
    }
    return null
}

function LoadingScreen({ progress, visible }: { progress: number; visible: boolean }) {
    return (
        <div className={`loader ${visible ? '' : 'hidden'}`}>
            <div className="loader__bar-track">
                <div className="loader__bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="loader__text">Summoning…</div>
        </div>
    )
}

function LoaderBridge({ onLoaded, setProgress }: { onLoaded: () => void; setProgress: (p: number) => void }) {
    const { progress, active } = useProgress()
    setProgress(progress)
    if (!active && progress === 100) {
        setTimeout(onLoaded, 600)
    }
    return null
}

export default function App() {
    const [loaded, setLoaded] = useState(false)
    const [progress, setProgress] = useState(0)

    // Refs for GSAP text intro
    const eyebrowRef = useRef<HTMLSpanElement>(null)
    const titleRef = useRef<HTMLHeadingElement>(null)
    const lineRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    // Start with text hidden (GSAP will animate it in)
    const [textReady, setTextReady] = useState(false)

    // When the 3D mask's intro animation completes, fire the text reveal
    const handleMaskReady = useCallback(() => {
        setTextReady(true)
    }, [])

    // GSAP text intro timeline — fires after mask emergence
    useEffect(() => {
        if (!textReady) return

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

        // Eyebrow — Japanese text fades in from above
        tl.fromTo(
            eyebrowRef.current,
            { y: -20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8 }
        )
            // Title — dramatic reveal from below with scale
            .fromTo(
                titleRef.current,
                { y: 50, opacity: 0, scale: 0.92 },
                { y: 0, opacity: 1, scale: 1, duration: 1.4, ease: 'power4.out' },
                '-=0.4'
            )
            // Decorative line draws in
            .fromTo(
                lineRef.current,
                { scaleX: 0, opacity: 0 },
                { scaleX: 1, opacity: 1, duration: 0.8, ease: 'power2.inOut' },
                '-=0.6'
            )
            // Bottom text fades in
            .fromTo(
                bottomRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 1.2 },
                '-=0.3'
            )

        return () => { tl.kill() }
    }, [textReady])

    return (
        <>
            {/* Loading overlay */}
            <LoadingScreen progress={progress} visible={!loaded} />

            {/* CSS overlays */}
            <div className="vignette" />
            <div className="grain" />

            {/* Text overlay — starts invisible, GSAP animates in */}
            <div className="overlay">
                <span
                    ref={eyebrowRef}
                    className="overlay__eyebrow"
                    style={{ opacity: 0 }}
                >
                    闇の祝福
                </span>
                <h1
                    ref={titleRef}
                    className="overlay__title"
                    style={{ opacity: 0 }}
                >
                    HAIL THE<br />SHADOW
                </h1>
                <div
                    ref={lineRef}
                    className="overlay__line"
                    style={{ opacity: 0 }}
                />
            </div>

            <div
                ref={bottomRef}
                className="overlay__bottom"
                style={{ opacity: 0 }}
            >
                影に栄光あれ
            </div>

            {/* 3D Scene */}
            <div className="scene-container">
                <Canvas
                    camera={{ position: [0, 0.8, 9], fov: 38 }}
                    gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                    dpr={[1, 2]}
                >
                    <LoaderBridge onLoaded={() => setLoaded(true)} setProgress={setProgress} />

                    <Suspense fallback={<Loader onLoaded={() => setLoaded(true)} />}>
                        {/* Dark, dramatic lighting */}
                        <color attach="background" args={['#030008']} />
                        <fog attach="fog" args={['#030008', 6, 18]} />

                        {/* Moody purple rim light from behind */}
                        <directionalLight
                            position={[0, 3, -5]}
                            intensity={1.8}
                            color="#6b21a8"
                        />
                        {/* Subtle cold fill from below */}
                        <directionalLight
                            position={[-3, -2, 2]}
                            intensity={0.3}
                            color="#1e1b4b"
                        />
                        {/* Key light – very dim, cold */}
                        <directionalLight
                            position={[4, 2, 4]}
                            intensity={0.6}
                            color="#312e81"
                        />
                        {/* Faint ambient */}
                        <ambientLight intensity={0.08} color="#0f0520" />

                        <Environment preset="night" />

                        {/* 3D Mask — with intro animation + mouse reactivity */}
                        <Mask onReady={handleMaskReady} />

                        {/* Atmospheric particles */}
                        <ShadowParticles count={2500} />

                        {/* Post-processing */}
                        <EffectComposer>
                            <Bloom
                                intensity={0.8}
                                luminanceThreshold={0.3}
                                luminanceSmoothing={0.9}
                                mipmapBlur
                            />
                            <Vignette
                                offset={0.35}
                                darkness={0.85}
                                blendFunction={BlendFunction.NORMAL}
                            />
                            <ChromaticAberration
                                offset={new Vector2(0.0008, 0.0008)}
                                blendFunction={BlendFunction.NORMAL}
                                radialModulation={false}
                                modulationOffset={0}
                            />
                        </EffectComposer>
                    </Suspense>
                </Canvas>
            </div>
        </>
    )
}
