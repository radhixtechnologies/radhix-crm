import { useState, useEffect } from "react";
import industrySolutions from "../data/industrySolutions.json";

// Import images to ensure they are bundled by Vite
import ecommerceImg from "../assets/image.png";
import b2bImg from "../assets/image copy .png";
import realestateImg from "../assets/image copy 2.png";
import saasImg from "../assets/image copy 3.png";
import professionalImg from "../assets/image copy 4.png";

// Map images using IDs instead of paths for better reliability
const imageMap = {
  "ecommerce": ecommerceImg,
  "b2b": b2bImg,
  "realestate": realestateImg,
  "saas": saasImg,
  "professional": professionalImg,
};

function IndustrySolutions() {
  const [activeTab, setActiveTab] = useState("ecommerce");
  const activeSolution = industrySolutions.find((sol) => sol.id === activeTab);
  const [isPaused, setIsPaused] = useState(false);

  // Define all 5 icons as components
  const iconComponents = [
    {
      id: "cart",
      svg: (
        <svg
          className="h-6 w-6 shrink-0 text-slate-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      id: "book",
      svg: (
        <svg
          className="h-6 w-6 shrink-0 text-slate-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      id: "play",
      svg: (
        <svg
          className="h-6 w-6 shrink-0 text-slate-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "bag",
      svg: (
        <svg
          className="h-6 w-6 shrink-0 text-slate-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
    },
    {
      id: "location",
      svg: (
        <svg
          className="h-6 w-6 shrink-0 text-slate-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  // Different icon sequences for each position (shuffled differently)
  const iconSequences = [
    [0, 1, 2, 3, 4], // Position 1: cart, book, play, bag, location
    [1, 3, 0, 4, 2], // Position 2: book, bag, cart, location, play
    [2, 4, 1, 0, 3], // Position 3: play, location, book, cart, bag
    [3, 0, 4, 2, 1], // Position 4: bag, cart, location, play, book
    [4, 2, 3, 1, 0], // Position 5: location, play, bag, book, cart
  ];

  // Create scrolling sequences for each position with different icon orders
  const createScrollingSequence = (sequenceIndex) => {
    const sequence = [];
    const iconOrder = iconSequences[sequenceIndex];
    for (let i = 0; i < 40; i++) {
      const iconIndex = iconOrder[i % iconOrder.length];
      sequence.push(iconComponents[iconIndex]);
    }
    return sequence;
  };

  // Smooth continuous scrolling - no pause/resume for smoother animation
  useEffect(() => {
    // Keep animations running continuously for smoother effect
    setIsPaused(false);
  }, []);

  return (
    <section className="bg-white py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1400px] px-4">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            <span className="text-slate-900">Powering every industry.</span>
            <br />
            <span className="text-indigo-600">Powering all disruptors.</span>
          </h2>
          <div className="hidden items-center gap-3 sm:gap-4 md:flex">
            {/* Icons with vertical slot machine scrolling */}
            <div className="flex gap-6">
              {/* Each position scrolls through different icon sequences */}
              {[0, 1, 2, 3, 4].map((sequenceIndex, positionIndex) => {
                const sequence = createScrollingSequence(sequenceIndex);
                return (
                  <div
                    key={positionIndex}
                    className="relative h-6 w-6 overflow-hidden"
                  >
                    <div
                      className={`animate-icon-scroll-${positionIndex + 1} flex flex-col`}
                      style={{
                        animationPlayState: isPaused ? "paused" : "running",
                        transition: "animation-play-state 0.3s ease",
                      }}
                    >
                      {sequence.map((icon, i) => (
                        <div
                          key={`${icon.id}-${i}`}
                          className="flex-shrink-0"
                        >
                          {icon.svg}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 sm:mb-8 border-b border-slate-200">
          <nav className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-2">
            {industrySolutions.map((solution) => (
              <button
                key={solution.id}
                onClick={() => setActiveTab(solution.id)}
                className={`whitespace-nowrap border-b-2 pb-4 text-sm font-medium transition ${activeTab === solution.id
                  ? "border-[#4f46e5] text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
              >
                {solution.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Card with Image and Overlay */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl">
          {/* Background Image Container */}
          <div className="relative h-[500px] sm:h-[550px] md:h-[600px] w-full">
            <img
              src={imageMap[activeSolution.id] || activeSolution.image}
              alt={activeSolution.name}
              className="h-full w-full object-cover"
            />
            {/* Overlay Box - Content z-index 10 for visibility */}
            <div className="absolute inset-x-0 bottom-0 md:top-0 md:bottom-auto md:left-0 md:h-full md:w-[55%] lg:w-[50%] z-10">
              <div className="flex h-full items-end md:items-center p-4 sm:p-6 md:p-8 lg:p-12">
                <div className="rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-md p-5 sm:p-6 md:p-8 shadow-2xl relative">
                  <h3 className="mb-3 sm:mb-4 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-slate-900 leading-tight">
                    {activeSolution.headline}{" "}
                    <span className="text-[#4f46e5]">
                      {activeSolution.highlightedWord}
                    </span>
                  </h3>
                  <p className="mb-6 sm:mb-8 text-sm sm:text-base text-slate-600 lg:text-lg leading-relaxed">
                    {activeSolution.description}
                  </p>
                  <button className="rounded-lg bg-[#6366f1] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#818cf8] hover:shadow-lg hover:-translate-y-0.5 sm:px-6 sm:py-3 sm:text-base">
                    <span className="hidden sm:inline">See Solutions →</span>
                    <span className="sm:hidden">See Solutions</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default IndustrySolutions;

