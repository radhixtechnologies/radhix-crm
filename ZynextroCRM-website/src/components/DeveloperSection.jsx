import codeSnippet from "../data/codeSnippet.json";
import CodeEditor from "./CodeEditor";

const languages = ["Python", "PHP", "Node JS", "cURL", "Java", "Go"];

const highlights = [
  {
    title: "Integrations",
    copy: "All popular SDKs, plugins, and server integrations to plug into your stack.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        />
      </svg>
    ),
  },
  {
    title: "API Reference",
    copy: "Full coverage docs with examples for every request and response.",
    icon: (
      <svg
        className="h-6 w-6"
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
    title: "Webhooks",
    copy: "Subscribe to events and ship real-time alerts without polling.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    ),
  },
];

function DeveloperSection() {
  const marqueeItems = [
    ...languages,
    ...languages,
    ...languages,
    ...languages,
    ...languages,
    ...languages,
    ...languages,
    ...languages,
  ];

  return (
    <section className="bg-linear-to-b from-white via-slate-50 to-slate-100 text-slate-900">
      {/* Marquee Section */}
      <div className="border-b border-emerald-200/60 bg-white py-3 sm:py-4 overflow-hidden">
        <div className="flex animate-marquee-slow gap-4 sm:gap-6 md:gap-8 whitespace-nowrap text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] text-emerald-500">
          {marqueeItems.map((lang, index) => (
            <span
              key={`${lang}-${index}`}
              className="flex items-center gap-2 sm:gap-3 whitespace-nowrap shrink-0"
            >
              {lang}
              <span className="text-emerald-200">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        {/* Header Section */}
        <div className="mb-8 sm:mb-10 md:mb-12 space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight text-slate-900">
            DevFlow is built{" "}
            <span className="text-emerald-500">
              {"<"}for developers by developers{">"}
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">
            Start with the CLI, ship through the dashboard, or automate entirely
            with APIs. Pick the workflow your team loves; DevFlow keeps the
            boring bits scripted and the docs nearby.
          </p>
        </div>

        {/* Highlights Grid */}
        <div className="mb-8 sm:mb-10 md:mb-12 grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="p-3 sm:p-4 md:p-5 text-slate-700 rounded-lg hover:bg-white/50 transition-colors"
            >
              <div className="mb-3 sm:mb-4 text-slate-900">
                <div className="h-5 w-5 sm:h-6 sm:w-6">
                  {item.icon}
                </div>
              </div>
              <p className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                {item.title}
              </p>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.copy}
              </p>
              <button className="mt-3 sm:mt-4 text-xs sm:text-sm font-semibold text-slate-900 transition hover:text-emerald-500">
                View Docs →
              </button>
            </article>
          ))}
        </div>

        {/* Code Editor Section */}
        <div className="grid gap-4 sm:gap-6 md:gap-8 lg:gap-10 md:grid-cols-[1fr,1.2fr] md:items-start">
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900">
              Try it out for yourself
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">
              Run a sample request and inspect the payload. Switch languages at
              any time to see familiar snippets for your stack.
            </p>
          </div>
          <div>
            <CodeEditor
              title={codeSnippet.title}
              language={codeSnippet.language}
              snippet={codeSnippet.snippet}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default DeveloperSection;
