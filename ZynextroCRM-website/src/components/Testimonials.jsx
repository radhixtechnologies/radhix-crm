import { useEffect, useRef, useState } from "react";
import testimonials from "../data/testimonials.json";

// Import client images
import clt1 from "../assets/clt1.png";
import clt2 from "../assets/clt2.png";
import clt3 from "../assets/clt3.png";
import clt4 from "../assets/clt4.png";

const imageMap = {
  "../assets/clt1.png": clt1,
  "../assets/clt2.png": clt2,
  "../assets/clt3.png": clt3,
  "../assets/clt4.png": clt4,
};


function Testimonials() {
  // Duplicate testimonials exactly 2 times for seamless infinite scroll
  const marqueeItems = [...testimonials, ...testimonials];
  const scrollRef = useRef(null);
  const positionRef = useRef(0);
  const [flippedCards, setFlippedCards] = useState(new Set());

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const speed = 0.8; // pixels per frame (adjust for speed - higher = faster)
    let animationId;

    const animate = () => {
      positionRef.current -= speed;

      // Get the width of one set (half the total scrollWidth since we duplicated)
      const totalWidth = scrollContainer.scrollWidth;
      const oneSetWidth = totalWidth / 2;

      // When we've scrolled one full set, reset to 0
      // This is seamless because the second set is identical to the first
      if (Math.abs(positionRef.current) >= oneSetWidth) {
        positionRef.current = 0;
      }

      scrollContainer.style.transform = `translateX(${positionRef.current}px)`;
      animationId = requestAnimationFrame(animate);
    };

    // Start animation after a brief delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      animate();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  const handleCardClick = (cardId) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="mb-6 sm:mb-10 text-center text-slate-900">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-teal-600">
            Voices
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold">
            <span className="text-slate-900">Stories from</span>{" "}
            <span className="text-indigo-600">the Users</span>
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 px-4">
            Hover or click a portrait to flip the card and read how Zynextro CRM fits their workflow.
          </p>
        </div>
      </div>
      <div className="overflow-hidden py-12 lg:py-16">
        <div
          ref={scrollRef}
          className="flex items-center gap-8 px-6 pb-8 will-change-transform"
        >
          {marqueeItems.map((person, index) => {
            const cardId = `${person.id}-${index}`;
            const isFlipped = flippedCards.has(cardId);
            return (
              <article
                key={cardId}
                className="group relative h-[18rem] w-[18rem] sm:h-[20rem] sm:w-[22rem] shrink-0 cursor-pointer transition-transform duration-500 even:translate-y-4 sm:even:translate-y-6 odd:-translate-y-2 sm:odd:-translate-y-4"
                onClick={() => handleCardClick(cardId)}
              >
                <div className={`relative h-full w-full rounded-xl border border-slate-100 bg-white shadow-lg transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : 'group-hover:[transform:rotateY(180deg)]'}`}>
                  <div className="absolute inset-0 overflow-hidden rounded-xl bg-slate-900/80 text-white [backface-visibility:hidden]">
                    <img
                      src={imageMap[person.photo] || person.photo}
                      alt={person.name}
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute left-5 right-5 bottom-5">
                      <p className="text-lg font-semibold leading-tight">
                        {person.name}
                      </p>
                      <p className="text-sm text-slate-200">{person.role}</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex h-full flex-col justify-between rounded-xl border border-slate-100 bg-white p-4 sm:p-6 text-slate-900 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <p className="text-sm sm:text-base md:text-lg font-semibold leading-tight text-slate-900">
                      "{person.feedback}"
                    </p>
                    <div className="text-xs sm:text-sm text-slate-500">
                      <p className="font-semibold text-slate-800">
                        {person.name}
                      </p>
                      <p>{person.role}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
