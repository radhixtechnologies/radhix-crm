function Tagline() {
  return (
    <section className="bg-gradient-to-b from-white to-slate-50 py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 text-center">
        <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-teal-600 font-semibold">
          Features
        </p>
        <h2 className="mt-3 sm:mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
          <span className="text-slate-900">Powerful CRM that feels</span>{" "}
          <span className="text-indigo-600">effortless to use</span>
        </h2>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          From lead capture to deal closure, every feature is designed to help
          your sales team work smarter and close deals faster.
        </p>
      </div>
    </section>
  )
}

export default Tagline

