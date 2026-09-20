import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import features from "../data/features.json";

// Import images to ensure they are bundled by Vite
import feat1 from "../assets/feat1.png";
import feat2 from "../assets/feat2.png";
import feat3 from "../assets/feat3.png";
import feat4 from "../assets/feat4.png";
import feat5 from "../assets/feat5.png";

// Map images
const imageMap = {
  "/src/assets/feat1.png": feat1,
  "/src/assets/feat2.png": feat2,
  "/src/assets/feat3.png": feat3,
  "/src/assets/feat4.png": feat4,
  "/src/assets/feat5.png": feat5,
};

gsap.registerPlugin(ScrollTrigger);

const colorThemes = {
  1: { bg: "from-green-50 to-green-100", accent: "text-green-600", border: "border-green-200" },
  2: { bg: "from-purple-50 to-purple-100", accent: "text-purple-600", border: "border-purple-200" },
  3: { bg: "from-blue-50 to-blue-100", accent: "text-blue-600", border: "border-blue-200" },
};

function FeatureSection() {
  const sectionRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const [activeSection, setActiveSection] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // GSAP ScrollTrigger Animation (Desktop Only)
  useEffect(() => {
    if (isMobile || !cardsContainerRef.current) return;

    const cards = cardsContainerRef.current.querySelectorAll(".feature-card");
    const numCards = cards.length;

    // Clear existing ScrollTriggers
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

    // Calculate consistent spacing between card transitions
    const transitionDuration = 1.2; // Duration for each card transition
    const spacing = 1.0; // Spacing between transitions (in timeline units)

    // Use actual container height for scroll distance calculation
    const container = cardsContainerRef.current?.querySelector('.relative');
    const cardHeight = container?.offsetHeight || window.innerHeight * 0.75;
    const scrollDistance = cardHeight * (numCards - 0.5); // Smoother scroll distance

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: `+=${scrollDistance}`,
        scrub: 0.8, // Reduced for smoother scroll-linked animation
        pin: true,
        anticipatePin: 1,
        pinSpacing: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const totalDuration = (numCards - 1) * spacing;
          const timelinePos = progress * totalDuration;

          // Determine active card based on timeline position
          let newIndex = 0;
          for (let i = 0; i < numCards; i++) {
            if (timelinePos >= i * spacing) {
              newIndex = i;
            }
          }
          setActiveSection(newIndex);

          // Update z-index dynamically for proper layering
          cards.forEach((card, idx) => {
            if (idx === newIndex) {
              card.style.zIndex = numCards + 10; // Active card on top
            } else if (idx < newIndex) {
              card.style.zIndex = numCards - (newIndex - idx); // Stacked cards
            } else {
              card.style.zIndex = idx; // Cards below
            }
          });
        },
      },
    });

    // Set initial states for all cards
    cards.forEach((card, index) => {
      if (index === 0) {
        // First card starts visible at center
        gsap.set(card, {
          y: 0,
          opacity: 1,
          scale: 0.98,
          zIndex: numCards + 10
        });
      } else {
        // Other cards start off-screen below
        gsap.set(card, {
          y: 600,
          opacity: 0,
          scale: 0.95,
          zIndex: index
        });
      }
    });

    // Animate cards with smooth stacking effect
    cards.forEach((card, index) => {
      if (index > 0) {
        const timelinePosition = index * spacing;

        // Slide the new card up from bottom to center
        tl.to(
          card,
          {
            y: 0,
            opacity: 1,
            scale: 0.98, // Active card scale
            duration: transitionDuration,
            ease: "power1.inOut", // Smoother, more natural easing
          },
          timelinePosition
        );

        // Move and scale all previous cards (stacking effect)
        for (let i = 0; i < index; i++) {
          const stackLevel = index - i;
          const stackY = -stackLevel * 40; // Tighter stacking (40px instead of 60px)
          const stackScale = 1.02; // Stacked cards slightly larger for depth
          const stackOpacity = Math.max(0.75, 1 - stackLevel * 0.08);

          tl.to(
            cards[i],
            {
              y: stackY,
              scale: stackScale,
              opacity: stackOpacity,
              duration: transitionDuration,
              ease: "power1.inOut",
            },
            timelinePosition
          );
        }
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [isMobile]);

  const currentTheme = colorThemes[features[activeSection]?.id] || colorThemes[1];

  // Mobile: Simple stacked layout
  if (isMobile) {
    return (
      <section className="bg-linear-to-b from-white to-slate-50 py-8 sm:py-12 md:py-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="space-y-8 sm:space-y-10 md:space-y-12">
            {features.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Desktop: Scroll-jacked sticky animation
  return (
    <section
      ref={sectionRef}
      className="relative bg-linear-to-b from-white to-slate-50 w-full pt-5"
      style={{ height: 'auto' }}
    >
      {/* Cards Container with Scroll Animation */}
      <div ref={cardsContainerRef} className="relative pt-10">
        <div className="sticky top-[60px] mx-auto max-w-[1400px] px-6 py-8">
          <div className="relative h-[50vh] md:h-[75vh]">
            {features.map((feature, index) => (
              <article
                key={feature.id}
                className="feature-card absolute top-12 left-0 w-full h-full bg-white rounded-2xl px-8 pt-8 pb-10 border border-slate-200 flex flex-col"
                style={{
                  zIndex: index,
                  transformOrigin: 'top center',
                  boxShadow: index === activeSection
                    ? '0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.08)'
                    : '0 8px 30px rgba(0, 0, 0, 0.06), 0 2px 10px rgba(0, 0, 0, 0.04)',
                  transition: 'box-shadow 0.4s ease',
                  willChange: 'transform, opacity',
                  borderColor: index === activeSection ? 'rgba(148, 163, 184, 0.3)' : 'rgba(226, 232, 240, 1)',
                }}
              >
                {/* Main Title */}
                <h2 className="mb-8 text-4xl lg:text-5xl font-bold text-slate-900">
                  {feature.title}
                </h2>

                {/* Grid of 4 Sub-Cards in Single Row (4 columns like Razorpay) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-0">
                  {feature.items.map((item) => (
                    <SubFeatureCard key={item.id} item={item} />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Feature Card Component (used in mobile view)
function FeatureCard({ feature }) {
  return (
    <article className="w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
      <h3 className="mb-4 sm:mb-6 md:mb-8 text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">
        {feature.title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {feature.items.map((item) => (
          <SubFeatureCard key={item.id} item={item} />
        ))}
      </div>
    </article>
  );
}

// Sub Feature Card with image full card and text on hover/click
function SubFeatureCard({ item }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    setIsActive(!isActive);
  };

  return (
    <div
      className="group relative rounded-lg sm:rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg cursor-pointer h-64 sm:h-full"
      onClick={handleClick}
    >
      {/* Image Container - Full card coverage */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-50 to-slate-100">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500"></div>
          </div>
        )}

        {imageError && (
          <div className="flex h-full items-center justify-center bg-slate-100 text-slate-400">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        <img
          src={item.image}
          alt={item.title}
          className={`h-full w-full object-cover transition-all duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"
            } ${!isActive ? "group-hover:scale-110" : ""}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>

      {/* Text Content - Appears on hover/click */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white p-3 sm:p-4 md:p-5 transform transition-all duration-500 ease-in-out border-t border-slate-200 ${isActive ? "translate-y-0" : "translate-y-full group-hover:translate-y-0"
          }`}
      >
        <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1 sm:mb-2">
          {item.title}
        </h4>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {item.description}
        </p>
      </div>
    </div>
  );
}

export default FeatureSection;
