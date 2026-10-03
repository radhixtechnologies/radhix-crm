import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import styles from "./features.module.css";
import features from "../data/features.json";

gsap.registerPlugin(ScrollTrigger);

// Import images 
import feat1 from "../assets/feat1.png";
import feat2 from "../assets/feat2.png";
import feat3 from "../assets/feat3.png";
import feat4 from "../assets/feat4.png";
import feat5 from "../assets/feat5.png";

const imageMap = {
    1: feat1,
    2: feat2,
    3: feat3,
    4: feat4,
    5: feat5,
};

function Features() {
    const sectionRef = useRef(null);
    const cardsContainerRef = useRef(null);
    const [activeSection, setActiveSection] = useState(0);

    // Helper to render title with specific highlighted text
    const renderTitle = (title, highlighted) => {
        if (!highlighted) return title;

        // Split text by the highlighted part
        const parts = title.split(highlighted);
        return (
            <>
                {parts[0]}
                <span className={styles['feat-highlight']}>{highlighted}</span>
                {parts[1]}
            </>
        );
    };

    // GSAP ScrollTrigger Stacking Animation
    useEffect(() => {
        if (!cardsContainerRef.current) return;

        // Ensure images are loaded before animation calculations if possible, 
        // or just rely on ResizeObserver/ScrollTrigger.refresh()

        const cards = cardsContainerRef.current.querySelectorAll(`.${styles['feat-card']}`);
        const numCards = cards.length;

        // Clear existing ScrollTriggers
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

        // Performance optimization: Use faster easing and reduced scrub
        const transitionDuration = 1.0;
        const spacing = 1.0;

        // Calculate scroll distance based on viewport
        const container = cardsContainerRef.current?.querySelector(`.${styles['feat-stacked-cards']}`);
        const cardHeight = container?.offsetHeight || window.innerHeight * 0.75;
        const scrollDistance = cardHeight * (numCards - 0.3);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "center center",
                end: `+=${scrollDistance}`,
                scrub: 0.5,
                pin: true,
                anticipatePin: 1,
                pinSpacing: true,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    const progress = self.progress;
                    const totalDuration = (numCards - 1) * spacing;
                    const timelinePos = progress * totalDuration;

                    let newIndex = 0;
                    for (let i = 0; i < numCards; i++) {
                        if (timelinePos >= i * spacing) {
                            newIndex = i;
                        }
                    }
                    setActiveSection(newIndex);
                },
            },
        });

        // Set initial states
        cards.forEach((card, index) => {
            if (index === 0) {
                gsap.set(card, {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    zIndex: index + 1,
                    force3D: true
                });
            } else {
                gsap.set(card, {
                    y: 500,
                    opacity: 0,
                    scale: 0.96,
                    zIndex: index + 1,
                    force3D: true
                });
            }
        });

        // Animate cards
        cards.forEach((card, index) => {
            if (index > 0) {
                const timelinePosition = index * spacing;
                tl.to(
                    card,
                    {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: transitionDuration,
                        ease: "power2.out",
                        force3D: true
                    },
                    timelinePosition
                );

                // Stack effect for previous cards
                for (let i = 0; i < index; i++) {
                    const stackLevel = index - i;
                    const stackY = -stackLevel * 35;
                    const stackScale = 1.01 + (stackLevel * 0.005);

                    tl.to(
                        cards[i],
                        {
                            y: stackY,
                            scale: stackScale,
                            opacity: 1,
                            duration: transitionDuration,
                            ease: "power2.out",
                            force3D: true
                        },
                        timelinePosition
                    );
                }
            }
        });

        const handleResize = () => {
            ScrollTrigger.refresh();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <section className={styles['features-root']} ref={sectionRef}>
            <div ref={cardsContainerRef} className={styles['feat-pin-container']}>
                <div className={styles['feat-sticky-wrapper']}>
                    <div className={styles['feat-stacked-cards']}>
                        {features.map((feature, index) => {
                            // Resolve image path
                            const bgImage = imageMap[feature.id] || feature.image;

                            return (
                                <div className={styles['feat-card']} key={index}>
                                    <div className={styles['feat-card-header']}>
                                        <div className={styles['feat-header-title']}>
                                            <div className={styles['feat-browser-dots']}>
                                                <span className={styles['feat-dot']}></span>
                                                <span className={styles['feat-dot']}></span>
                                                <span className={styles['feat-dot']}></span>
                                            </div>
                                            <h1>{renderTitle(feature.title, feature.highlighted)}</h1>
                                        </div>
                                        <div className={styles['feat-header-desc']}>
                                            <p>{feature.description}</p>
                                        </div>
                                    </div>

                                    <div className={styles['feat-card-body']}>
                                        <div
                                            className={styles['feat-card-image']}
                                            style={{ backgroundImage: `url(${bgImage})` }}
                                        />
                                        <div className={styles['feat-card-overlay']} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Features;