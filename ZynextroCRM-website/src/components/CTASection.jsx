function CTASection() {
  return (
    <section className="bg-indigo-50 py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          {/* Text Content */}
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              <span className="text-slate-900">Supercharge your business</span>{" "}
              <span className="text-indigo-600">with Zynextro CRM</span>
            </h2>
          </div>

          {/* CTA Button */}
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-[#6366f1] px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white transition hover:bg-[#818cf8]">
            <span>Sign Up Now</span>
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
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
        </div>
      </div>
    </section>
  );
}

export default CTASection;
