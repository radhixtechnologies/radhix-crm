import { useState } from "react";
import { Link } from "react-router-dom";

function Pricing() {
    const [billingCycle, setBillingCycle] = useState("monthly"); // monthly or annual
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    const pricingPlans = [
        {
            id: "basic",
            name: "Basic",
            description: "Perfect for small teams getting started",
            monthlyPrice: 99,
            annualPrice: 990, // 17% discount (approx 2 months free)
            features: [
                "Up to 500 leads",
                "3 team members",
                "Basic pipeline management",
                "Basic quote generation",
                "10 dashboard metrics",
                "Email support",
                "Mobile app access",
            ],
            cta: "Start Free Trial",
            highlighted: false,
        },
        {
            id: "standard",
            name: "Standard",
            description: "For growing businesses",
            monthlyPrice: 149,
            annualPrice: 1490, // 17% discount
            features: [
                "Up to 5,000 leads",
                "15 team members",
                "Advanced pipeline management",
                "Smart quote generation with templates",
                "20+ dashboard metrics",
                "AI-powered lead scoring",
                "Advanced automation workflows",
                "Priority support",
                "API access",
                "Custom reports",
            ],
            cta: "Start Free Trial",
            highlighted: true,
            badge: "Most Popular",
        },
        {
            id: "premium",
            name: "Premium",
            description: "For large organizations",
            monthlyPrice: 249,
            annualPrice: 2490, // 17% discount
            customPricing: false,
            features: [
                "Unlimited leads",
                "Unlimited team members",
                "Custom pipeline stages",
                "Industry-specific templates",
                "Custom dashboard metrics",
                "Advanced AI analytics",
                "Full workflow automation",
                "Dedicated account manager",
                "Custom integrations",
                "SLA guarantee",
                "On-premise deployment option",
                "White-label solution",
            ],
            cta: "Start Free Trial",
            highlighted: false,
        },
    ];

    const faqs = [
        {
            question: "Can I change plans later?",
            answer: "Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept all major credit cards, debit cards, UPI, net banking, and also offer invoicing for annual plans.",
        },
        {
            question: "Is there a free trial?",
            answer: "Yes! All plans come with a 7-day free trial. No credit card required to start.",
        },
        {
            question: "What happens when I exceed my lead limit?",
            answer: "We'll notify you when you're approaching your limit. You can upgrade your plan or archive old leads to stay within your limit.",
        },
    ];

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(price);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    return (
        <div className="bg-gradient-to-b from-white to-slate-50">
            {/* Hero Section */}
            <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 md:pb-20">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                    <div className="text-center">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900">
                            Simple, Transparent Pricing
                        </h1>
                        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                            Choose the perfect plan for your business. All plans include a 7-day free trial.
                        </p>

                        {/* Billing Toggle */}
                        <div className="mt-8 inline-flex items-center gap-4 rounded-full bg-slate-100 p-1">
                            <button
                                onClick={() => setBillingCycle("monthly")}
                                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${billingCycle === "monthly"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle("annual")}
                                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${billingCycle === "annual"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Annual
                                <span className="ml-2 text-xs text-green-600 font-bold">Save 17%</span>
                            </button>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {pricingPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl bg-white p-6 sm:p-8 shadow-lg transition-all hover:shadow-xl ${plan.highlighted
                                    ? "ring-2 ring-[#4f46e5] scale-105 md:scale-110"
                                    : "ring-1 ring-slate-200"
                                    }`}
                            >
                                {/* Badge */}
                                {plan.badge && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-[#4f46e5] to-[#818cf8] px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                                            {plan.badge}
                                        </span>
                                    </div>
                                )}

                                {/* Plan Header */}
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                    <p className="mt-2 text-sm text-slate-600">{plan.description}</p>

                                    {/* Price */}
                                    <div className="mt-6">
                                        {plan.customPricing ? (
                                            <div>
                                                <p className="text-4xl font-bold text-slate-900">Custom</p>
                                                <p className="mt-2 text-sm text-slate-600">Contact us for pricing</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-baseline justify-center gap-2">
                                                    <span className="text-4xl font-bold text-slate-900">
                                                        {formatPrice(
                                                            billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice
                                                        )}
                                                    </span>
                                                    <span className="text-slate-600">
                                                        per user / {billingCycle === "monthly" ? "month" : "year"}
                                                    </span>
                                                </div>
                                                {billingCycle === "annual" && (
                                                    <p className="mt-1 text-sm text-green-600 font-semibold">
                                                        Save {formatPrice(plan.monthlyPrice * 12 - plan.annualPrice)} per year
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={scrollToTop}
                                    className={`mt-6 w-full rounded-lg px-6 py-3.5 text-base font-semibold transition-all ${plan.highlighted
                                        ? "bg-gradient-to-r from-[#4f46e5] to-[#818cf8] text-white hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5"
                                        : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                                        }`}
                                >
                                    {plan.cta}
                                </button>

                                {/* Features */}
                                <div className="mt-8 space-y-3">
                                    <p className="text-sm font-semibold text-slate-900">What's included:</p>
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <svg
                                                    className="h-5 w-5 shrink-0 text-[#4f46e5] mt-0.5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2.5}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                                <span className="text-sm text-slate-600">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-12 sm:py-16 bg-white">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="max-w-[1400px] mx-auto space-y-4">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden transition-all hover:border-indigo-300"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full flex items-center justify-between p-6 text-left"
                                >
                                    <h3 className="text-lg font-semibold text-slate-900 pr-4">{faq.question}</h3>
                                    <svg
                                        className={`w-6 h-6 text-slate-600 shrink-0 transition-transform ${openFaqIndex === idx ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openFaqIndex === idx && (
                                    <div className="px-6 pb-6">
                                        <p className="text-slate-600">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 sm:py-16 bg-gradient-to-r from-[#4f46e5] to-[#818cf8]">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white">
                        Ready to supercharge your sales?
                    </h2>
                    <p className="mt-4 text-lg text-indigo-100 max-w-2xl mx-auto">
                        Start your 7-day free trial today. No credit card required.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={scrollToTop}
                            className="rounded-lg bg-white px-8 py-4 text-base font-bold text-[#4f46e5] transition hover:shadow-xl hover:-translate-y-0.5"
                        >
                            Start Free Trial
                        </button>
                        <Link
                            to="/contact-us"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="rounded-lg border-2 border-white px-8 py-4 text-base font-bold text-white transition hover:bg-white/10"
                        >
                            Schedule a Demo
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Pricing;
