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
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Mask from './components/Mask'
import ShadowParticles from './components/ShadowParticles'

gsap.registerPlugin(ScrollTrigger)

/* ── Loading helpers ── */
function Loader({ onLoaded }: { onLoaded: () => void }) {
    const { progress, active } = useProgress()
    if (!active && progress === 100) setTimeout(onLoaded, 400)
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
    if (!active && progress === 100) setTimeout(onLoaded, 600)
    return null
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function App() {
    const [loaded, setLoaded] = useState(false)
    const [progress, setProgress] = useState(0)

    // Hero text refs for GSAP intro
    const eyebrowRef = useRef<HTMLSpanElement>(null)
    const titleRef = useRef<HTMLHeadingElement>(null)
    const subtitleRef = useRef<HTMLParagraphElement>(null)
    const lineRef = useRef<HTMLDivElement>(null)
    const ctaRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    const [textReady, setTextReady] = useState(false)
    const handleMaskReady = useCallback(() => setTextReady(true), [])

    // GSAP hero text intro
    useEffect(() => {
        if (!textReady) return
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        tl.fromTo(eyebrowRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
            .fromTo(titleRef.current, { y: 50, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 1.4, ease: 'power4.out' }, '-=0.4')
            .fromTo(subtitleRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power2.out' }, '-=0.6')
            .fromTo(lineRef.current, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.8, ease: 'power2.inOut' }, '-=0.5')
            .fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.3')
            .fromTo(bottomRef.current, { opacity: 0 }, { opacity: 1, duration: 1.2 }, '-=0.3')
        return () => { tl.kill() }
    }, [textReady])

    // GSAP ScrollTrigger for content sections
    useEffect(() => {
        if (!textReady) return

        // Reveal all [data-reveal] elements
        const reveals = document.querySelectorAll('[data-reveal]')
        reveals.forEach((el) => {
            const dir = el.getAttribute('data-reveal') || 'up'
            const fromVals: Record<string, object> = {
                up: { y: 60, opacity: 0 },
                down: { y: -40, opacity: 0 },
                left: { x: -60, opacity: 0 },
                right: { x: 60, opacity: 0 },
                fade: { opacity: 0 },
                scale: { scale: 0.9, opacity: 0 },
            }
            const toVals: Record<string, object> = {
                up: { y: 0, opacity: 1 },
                down: { y: 0, opacity: 1 },
                left: { x: 0, opacity: 1 },
                right: { x: 0, opacity: 1 },
                fade: { opacity: 1 },
                scale: { scale: 1, opacity: 1 },
            }
            gsap.fromTo(el, fromVals[dir], {
                ...toVals[dir],
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    once: true,
                },
            })
        })

        // Animate tracker bar fill on scroll
        const trackerFill = document.querySelector('.tracker__fill') as HTMLElement
        if (trackerFill) {
            gsap.to(trackerFill, {
                width: '100%',
                duration: 2.5,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: trackerFill,
                    start: 'top 80%',
                    once: true,
                },
            })
        }

        // Stagger faction cards
        gsap.fromTo('.faction-card',
            { y: 40, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.7,
                ease: 'power2.out',
                stagger: 0.12,
                scrollTrigger: {
                    trigger: '.factions-grid',
                    start: 'top 80%',
                    once: true,
                },
            }
        )

        // Stagger interactive cards
        gsap.fromTo('.interactive-card',
            { y: 40, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.7,
                ease: 'power2.out',
                stagger: 0.15,
                scrollTrigger: {
                    trigger: '.interactive-grid',
                    start: 'top 80%',
                    once: true,
                },
            }
        )

        // Stagger tier items
        gsap.fromTo('.tier',
            { x: -30, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                duration: 0.6,
                ease: 'power2.out',
                stagger: 0.1,
                scrollTrigger: {
                    trigger: '.tiers',
                    start: 'top 80%',
                    once: true,
                },
            }
        )

        return () => { ScrollTrigger.getAll().forEach((t) => t.kill()) }
    }, [textReady])

    return (
        <>
            <LoadingScreen progress={progress} visible={!loaded} />
            <div className="vignette" />
            <div className="grain" />

            {/* ═══ HERO ═══ */}
            <section className="hero">
                <div className="hero__overlay">
                    <span ref={eyebrowRef} className="hero__eyebrow" style={{ opacity: 0 }}>闇の祝福</span>
                    <h1 ref={titleRef} className="hero__title" style={{ opacity: 0 }}>
                        HAIL THE<br />SHADOW
                    </h1>
                    <p ref={subtitleRef} className="hero__subtitle" style={{ opacity: 0 }}>
                        In a world devoured by nightmares, only those who bind themselves to darkness survive.
                    </p>
                    <div ref={lineRef} className="hero__line" style={{ opacity: 0 }} />
                    <div ref={ctaRef} className="hero__cta-group" style={{ opacity: 0 }}>
                        <button className="hero__cta hero__cta--primary">Enter the Dream Realm</button>
                        <button className="hero__cta">Begin Your Descent</button>
                    </div>
                </div>
                <div ref={bottomRef} className="hero__bottom" style={{ opacity: 0 }}>影に栄光あれ</div>

                {/* 3D Scene */}
                <div className="scene-container">
                    <Canvas
                        camera={{ position: [0, 0.8, 9], fov: 38 }}
                        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                        dpr={[1, 2]}
                    >
                        <LoaderBridge onLoaded={() => setLoaded(true)} setProgress={setProgress} />
                        <Suspense fallback={<Loader onLoaded={() => setLoaded(true)} />}>
                            <color attach="background" args={['#030008']} />
                            <fog attach="fog" args={['#030008', 6, 18]} />
                            <directionalLight position={[0, 3, -5]} intensity={1.8} color="#6b21a8" />
                            <directionalLight position={[-3, -2, 2]} intensity={0.3} color="#1e1b4b" />
                            <directionalLight position={[4, 2, 4]} intensity={0.6} color="#312e81" />
                            <ambientLight intensity={0.08} color="#0f0520" />
                            <Environment preset="night" />
                            <Mask onReady={handleMaskReady} />
                            <ShadowParticles count={2500} />
                            <EffectComposer>
                                <Bloom intensity={0.8} luminanceThreshold={0.3} luminanceSmoothing={0.9} mipmapBlur />
                                <Vignette offset={0.35} darkness={0.85} blendFunction={BlendFunction.NORMAL} />
                                <ChromaticAberration offset={new Vector2(0.0008, 0.0008)} blendFunction={BlendFunction.NORMAL} radialModulation={false} modulationOffset={0} />
                            </EffectComposer>
                        </Suspense>
                    </Canvas>
                </div>
            </section>

            {/* ═══ CONTENT SECTIONS ═══ */}
            <div className="content">

                {/* ── About the World ── */}
                <section className="section">
                    <span className="section__eyebrow" data-reveal="fade">The World</span>
                    <h2 className="section__title" data-reveal="up">The World After the Spell</h2>
                    <p className="section__text section__text--emphasis" data-reveal="up">
                        The world fractured the moment the Spell awakened.
                    </p>
                    <p className="section__text" data-reveal="up">
                        Nightmares bled into reality. Ancient horrors surfaced from forgotten realms.
                        Those chosen by fate were branded, tested, and thrown into a crucible of survival.
                    </p>
                    <div className="section__break" data-reveal="fade">
                        <span className="section__break-line">Some broke.</span>
                        <span className="section__break-line">Some adapted.</span>
                        <span className="section__break-line">A rare few mastered their Shadows.</span>
                    </div>
                    <div className="section__divider" data-reveal="fade" />
                    <p className="section__text" data-reveal="up">
                        You are not a hero.<br />
                        You are not chosen by grace.<br />
                        <em>You are chosen by necessity.</em>
                    </p>
                </section>

                {/* ── The Dream Realm ── */}
                <section className="section">
                    <span className="section__eyebrow" data-reveal="fade">The Nightmare</span>
                    <h2 className="section__title" data-reveal="up">The Dream Realm</h2>
                    <p className="section__text section__text--emphasis" data-reveal="up">
                        Beyond waking life lies a place that does not forgive weakness.
                    </p>
                    <p className="section__text" data-reveal="up">
                        The Dream Realm is not merely a battleground. It is a proving ground. A shifting
                        world of ruins, forgotten gods, corrupted beasts, and silent cities swallowed by ash.
                    </p>
                    <div className="section__break" data-reveal="fade">
                        <span className="section__break-line">Every descent into a Nightmare reshapes you.</span>
                        <span className="section__break-line">Every victory demands a cost.</span>
                    </div>
                    <div className="section__divider" data-reveal="fade" />
                    <p className="section__text section__text--emphasis" data-reveal="up">
                        What you conquer there follows you back.
                    </p>
                </section>

                {/* ── Path of Ascension ── */}
                <section className="section">
                    <span className="section__eyebrow" data-reveal="fade">Power System</span>
                    <h2 className="section__title" data-reveal="up">The Path of Ascension</h2>
                    <p className="section__text section__text--emphasis" data-reveal="up">
                        Power is not granted. It is earned in blood.
                    </p>
                    <div className="tiers">
                        <div className="tier tier--awakened">
                            <span className="tier__name">Awakened</span>
                            <span className="tier__desc">The first step beyond humanity.</span>
                        </div>
                        <div className="tier tier--ascended">
                            <span className="tier__name">Ascended</span>
                            <span className="tier__desc">Hardened by countless trials.</span>
                        </div>
                        <div className="tier tier--transcendent">
                            <span className="tier__name">Transcendent</span>
                            <span className="tier__desc">No longer bound by mortal limits.</span>
                        </div>
                        <div className="tier tier--sovereign">
                            <span className="tier__name">Sovereign</span>
                            <span className="tier__desc">A force that bends reality itself.</span>
                        </div>
                    </div>
                    <div className="section__divider" data-reveal="fade" />
                    <p className="section__text" data-reveal="up">
                        Your Shadow grows as you do.
                    </p>
                    <div className="section__break" data-reveal="fade">
                        <span className="section__break-line">Feed it.</span>
                        <span className="section__break-line">Shape it.</span>
                        <span className="section__break-line">Or be consumed by it.</span>
                    </div>
                </section>

                {/* ── Shadow Bond ── */}
                <section className="section">
                    <span className="section__eyebrow" data-reveal="fade">The Bond</span>
                    <h2 className="section__title" data-reveal="up">Your Shadow Is Not<br />Your Enemy</h2>
                    <p className="section__text section__text--emphasis" data-reveal="up">
                        It is your weapon.
                    </p>
                    <p className="section__text" data-reveal="up">
                        A fragment of darkness bound to your soul. It learns. It adapts.
                        It reflects your fears and ambitions.
                    </p>
                    <div className="section__break" data-reveal="fade">
                        <span className="section__break-line">Some use their Shadow to protect.</span>
                        <span className="section__break-line">Others to conquer.</span>
                        <span className="section__break-line">Many are devoured by it.</span>
                    </div>
                    <div className="section__divider" data-reveal="fade" />
                    <p className="section__text" data-reveal="up">
                        The question is not whether you have one.
                    </p>
                    <p className="section__text section__text--emphasis" data-reveal="up">
                        The question is whether you control it.
                    </p>
                </section>

                {/* ── The Awakened (Characters) ── */}
                <section className="section">
                    <span className="section__eyebrow" data-reveal="fade">The Awakened</span>
                    <h2 className="section__title" data-reveal="up">The Awakened</h2>
                    <p className="section__text section__text--emphasis" data-reveal="up">
                        In this new world, strength defines worth.
                    </p>
                    <div className="section__break" data-reveal="fade">
                        <span className="section__break-line">Survivors who clawed their way through impossible Nightmares.</span>
                        <span className="section__break-line">Strategists who win without lifting a blade.</span>
                        <span className="section__break-line">Monsters wearing human faces.</span>
                        <span className="section__break-line">Humans becoming monsters.</span>
                    </div>
                    <div className="section__divider" data-reveal="fade" />
                    <p className="section__text" data-reveal="up">
                        All are bound by the same rule:
                    </p>
                    <p className="section__text section__text--emphasis" data-reveal="up">
                        Survive. Grow stronger. Or disappear.
                    </p>
                </section>

                {/* ── Factions ── */}
                <section className="section section--wide">
                    <span className="section__eyebrow" data-reveal="fade">Factions</span>
                    <h2 className="section__title" data-reveal="up">Powers Rising<br />From Ruin</h2>
                    <p className="section__text" data-reveal="up">
                        Civilizations did not fall quietly. From the ashes emerged:
                    </p>
                    <div className="factions-grid">
                        <div className="faction-card">
                            <h3 className="faction-card__name">The Citadel Houses</h3>
                            <p className="faction-card__desc">Military orders forged in discipline. Structure is their weapon, obedience their shield.</p>
                        </div>
                        <div className="faction-card">
                            <h3 className="faction-card__name">Independent Awakened</h3>
                            <p className="faction-card__desc">Rogue survivors who trust no banner. They walk alone through nightmares.</p>
                        </div>
                        <div className="faction-card">
                            <h3 className="faction-card__name">Shadow Cults</h3>
                            <p className="faction-card__desc">Those who worship the darkness they wield. Devotion turned to obsession.</p>
                        </div>
                        <div className="faction-card">
                            <h3 className="faction-card__name">Sovereign Domains</h3>
                            <p className="faction-card__desc">Territories ruled by transcendent beings. Power made into law.</p>
                        </div>
                    </div>
                    <div className="section__break" data-reveal="fade">
                        <span className="section__break-line">All competing.</span>
                        <span className="section__break-line">All watching.</span>
                        <span className="section__break-line">All preparing for the next catastrophe.</span>
                    </div>
                </section>

                {/* ── Interactive Section ── */}
                <section className="section section--wide">
                    <span className="section__eyebrow" data-reveal="fade">Explore</span>
                    <h2 className="section__title" data-reveal="up">Descend Deeper</h2>
                    <div className="interactive-grid">
                        <div className="interactive-card">
                            <span className="interactive-card__icon">⚔</span>
                            <h3 className="interactive-card__title">Take the Descent</h3>
                            <p className="interactive-card__desc">What Aspect would the Spell grant you? Discover your shadow affinity.</p>
                        </div>
                        <div className="interactive-card">
                            <span className="interactive-card__icon">📜</span>
                            <h3 className="interactive-card__title">Nightmare Archive</h3>
                            <p className="interactive-card__desc">Nightmare Classes, Corruption Tiers, Memory Weapons, Echoes, and Relics.</p>
                        </div>
                        <div className="interactive-card">
                            <span className="interactive-card__icon">◈</span>
                            <h3 className="interactive-card__title">Ascension Tracker</h3>
                            <p className="interactive-card__desc">Explore the rank system and understand the path from Awakened to Sovereign.</p>
                        </div>
                    </div>

                    {/* Ascension tracker bar */}
                    <div className="tracker" data-reveal="fade">
                        <div className="tracker__bar">
                            <div className="tracker__fill" />
                        </div>
                        <div className="tracker__labels">
                            <span className="tracker__label tracker__label--active">Awakened</span>
                            <span className="tracker__label">Ascended</span>
                            <span className="tracker__label">Transcendent</span>
                            <span className="tracker__label">Sovereign</span>
                        </div>
                    </div>
                </section>

                {/* ── Closing ── */}
                <section className="closing">
                    <h2 className="closing__title" data-reveal="up">The Shadow Waits</h2>
                    <p className="closing__text" data-reveal="up">The Nightmare never truly ends.</p>
                    <p className="closing__text" data-reveal="up">
                        It waits for the next descent.<br />
                        The next failure.<br />
                        The next evolution.
                    </p>
                    <div className="section__divider" style={{ margin: '2rem auto' }} data-reveal="fade" />
                    <p className="closing__text" data-reveal="up">The question is not whether darkness exists.</p>
                    <p className="closing__text closing__text--bold" data-reveal="up">
                        The question is whether you kneel… or rule.
                    </p>
                    <button className="closing__cta" data-reveal="scale">Step Into the Shadow</button>
                </section>
            </div>
        </>
    )
}
