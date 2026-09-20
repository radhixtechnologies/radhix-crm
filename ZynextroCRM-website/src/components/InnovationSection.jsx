import { useState } from "react";
import innovationFeatures from "../data/innovationFeatures.json";

function InnovationSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Show 2 cards at a time
  const visibleCards = innovationFeatures.slice(currentIndex, currentIndex + 2);

  // Determine if we're on the first set (index 0) or second set (index 2)
  const isFirstSet = currentIndex === 0;
  const isSecondSet = currentIndex === 2;

  const handlePrev = () => {
    setCurrentIndex(0); // Go back to first set
  };

  const handleNext = () => {
    setCurrentIndex(2); // Go to second set
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case "fast-forward":
        return (
          <svg
            className="h-5 w-5 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
            />
          </svg>
        );
      case "workflow":
        return (
          <svg
            className="h-5 w-5 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case "dashboard":
        return (
          <svg
            className="h-5 w-5 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case "team":
        return (
          <svg
            className="h-5 w-5 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const highlightText = (text, highlights) => {
    let parts = [{ text, highlighted: false }];

    highlights.forEach((highlight) => {
      const newParts = [];
      parts.forEach((part) => {
        if (part.highlighted) {
          newParts.push(part);
        } else {
          const index = part.text.indexOf(highlight);
          if (index !== -1) {
            if (index > 0) {
              newParts.push({
                text: part.text.substring(0, index),
                highlighted: false,
              });
            }
            newParts.push({ text: highlight, highlighted: true });
            if (index + highlight.length < part.text.length) {
              newParts.push({
                text: part.text.substring(index + highlight.length),
                highlighted: false,
              });
            }
          } else {
            newParts.push(part);
          }
        }
      });
      parts = newParts;
    });

    return parts.map((part, i) =>
      part.highlighted ? (
        <span key={i} className="text-[#4f46e5] font-semibold">
          {part.text}
        </span>
      ) : (
        part.text
      )
    );
  };

  return (
    <section className="bg-slate-100 py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        {/* Heading */}
        <h2 className="mb-8 sm:mb-10 md:mb-12 text-center text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
          <span className="text-slate-900">We have innovated at every instance,</span>{" "}
          <span className="text-indigo-600">creating a disruption.</span>
        </h2>

        {/* Cards Container with Navigation */}
        <div className="relative px-8 sm:px-12 md:px-16 lg:px-20">
          {/* Previous Button - Only show on second set */}
          {isSecondSet && (
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[#6366f1] p-2 sm:p-2.5 md:p-3 text-white shadow-lg transition hover:bg-[#818cf8]"
              aria-label="Previous cards"
            >
              <svg
                className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Cards Grid - Alternating wide/thin layout */}
          <div
            className={`grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 ${isFirstSet ? "md:grid-cols-[2fr_1fr]" : "md:grid-cols-[1fr_2fr]"
              }`}
          >
            {visibleCards.map((feature, index) => (
              <article
                key={feature.id}
                className="rounded-xl sm:rounded-2xl bg-white p-4 sm:p-5 md:p-6 lg:p-8 shadow-lg"
              >
                {/* Card Header */}
                <div className="mb-3 sm:mb-4 md:mb-6 flex items-center justify-between">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-700">
                    {feature.title}
                  </h3>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-4 w-4 sm:h-5 sm:w-5">
                      {getIcon(feature.icon)}
                    </div>
                  </div>
                </div>

                {/* Main Text with Highlights */}
                <p className="mb-3 sm:mb-4 text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight text-slate-900">
                  {highlightText(feature.mainText, feature.highlightedText)}
                </p>

                {/* Description */}
                <p className="mb-4 sm:mb-6 md:mb-8 text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {feature.description}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 md:gap-4">
                  <button className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-[#6366f1] px-3 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#818cf8] sm:px-4 sm:py-2 md:px-6 md:py-3">
                    <span>{feature.signUpText}</span>
                    <svg
                      className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                  <button className="text-xs sm:text-sm md:text-base font-semibold text-[#4f46e5] transition hover:text-[#818cf8] text-center sm:text-left">
                    {feature.knowMoreText}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Next Button - Only show on first set */}
          {isFirstSet && (
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[#6366f1] p-2 sm:p-2.5 md:p-3 text-white shadow-lg transition hover:bg-[#818cf8]"
              aria-label="Next cards"
            >
              <svg
                className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default InnovationSection;
