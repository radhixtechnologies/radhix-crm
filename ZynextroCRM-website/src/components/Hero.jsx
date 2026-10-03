import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import heroCards from "../data/heroCards.json";

// Import images
import hero1 from "../assets/hero1.jpg";
import hero2 from "../assets/hero2.jpg";
import hero3 from "../assets/hero3.jpg";

// Map images
const imageMap = {
    "../assets/hero1.jpg": hero1,
    "../assets/hero2.jpg": hero2,
    "../assets/hero3.jpg": hero3,
};

function Hero() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const timerRef = useRef(null);
    const progressRef = useRef(null);

    const activeCard = heroCards[activeIndex];

    // Auto-play logic
    useEffect(() => {
        if (isAutoPlaying) {
            timerRef.current = setInterval(() => {
                handleNext();
            }, 6000);
        }
        return () => clearInterval(timerRef.current);
    }, [activeIndex, isAutoPlaying]);

    // Animation when slide changes
    useGSAP(() => {
        // Animate content reset and fade in
        if (contentRef.current) {
            const elements = contentRef.current.querySelectorAll('.animate-item');
            gsap.fromTo(
                elements,
                { opacity: 0, y: 30, filter: "blur(10px)" },
                { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.1, ease: "power3.out" }
            );
        }

        // Animate Progress Bar
        if (progressRef.current) {
            if (isAutoPlaying) {
                gsap.fromTo(
                    progressRef.current,
                    { scaleX: 0 },
                    { scaleX: 1, duration: 6, ease: "none" }
                );
            } else {
                gsap.to(progressRef.current, { scaleX: 0, duration: 0.2 });
            }
        }
    }, { scope: containerRef, dependencies: [activeIndex] });

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % heroCards.length);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + heroCards.length) % heroCards.length);
    };

    const handleDotClick = (index) => {
        setActiveIndex(index);
        setIsAutoPlaying(false);
    };

    return (
        <section
            ref={containerRef}
            className="relative min-h-[100vh] flex items-center overflow-hidden pt-24 pb-12 group bg-slate-900"
        >
            {/* Background Image Carousel Layer */}
            <div className="absolute inset-0 z-0">
                {heroCards.map((card, idx) => (
                    <div
                        key={card.id || idx}
                        className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${idx === activeIndex ? "opacity-100 scale-100" : "opacity-0 scale-110"
                            }`}
                        style={{
                            backgroundImage: `url(${imageMap[card.image] || card.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {/* Very Light Black Gradient Overlay */}
                        <div className="absolute inset-0 bg-slate-900/20" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-transparent to-transparent" />
                    </div>
                ))}
            </div>

            {/* Content Layer */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-3xl" ref={contentRef}>
                    {/* Badge */}
                    <div className="animate-item inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/30 backdrop-blur-md mb-6">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-200">
                            Featured Solution
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 className="animate-item text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
                        {activeCard.title} <br />
                        <span className="text-indigo-400">
                            Made Effortless.
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="animate-item text-lg sm:text-xl text-slate-200 mb-8 leading-relaxed max-w-xl">
                        {activeCard.description}
                    </p>

                    {/* Features Grid */}
                    <div className="animate-item flex flex-wrap gap-3 mb-10">
                        {activeCard.features.map((feature, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center px-4 py-2 rounded-xl border border-white/20 text-sm font-medium text-slate-100 backdrop-blur-sm shadow-xl"
                            >
                                <svg className="w-4 h-4 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                {feature}
                            </span>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="animate-item flex flex-col sm:flex-row gap-4">
                        <Link
                            to="/pricing"
                            className="inline-flex justify-center items-center px-8 py-4 text-base font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-500 transition-all hover:-translate-y-1"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            to="/contact-us"
                            className="inline-flex justify-center items-center px-8 py-4 text-base font-bold text-white bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md hover:bg-white/20 transition-all hover:-translate-y-1"
                        >
                            Watch Demo
                        </Link>
                    </div>

                    {/* Progress Control */}
                    <div className="animate-item hidden lg:flex items-center gap-4 mt-16">
                        {heroCards.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleDotClick(idx)}
                                className={`group relative h-1 rounded-full transition-all duration-300 ${idx === activeIndex ? "w-16 bg-white/20" : "w-12 bg-white/10 hover:bg-white/30"
                                    }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            >
                                {idx === activeIndex && (
                                    <div
                                        ref={progressRef}
                                        className="absolute top-0 left-0 h-full w-full bg-indigo-400 rounded-full origin-left"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation Arrows */}
            <div className="absolute bottom-12 right-12 z-20 hidden md:flex gap-4">
                <button
                    onClick={handlePrev}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white backdrop-blur-md hover:bg-white/10 hover:scale-110 transition-all"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                    onClick={handleNext}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white backdrop-blur-md hover:bg-white/10 hover:scale-110 transition-all"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </section>
    );
}

export default Hero;