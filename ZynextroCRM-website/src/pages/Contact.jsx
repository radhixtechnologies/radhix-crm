import { useState } from "react";

function Contact() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        subject: "",
        message: "",
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/[\s-]/g, ""))) {
            newErrors.phone = "Phone number must be 10 digits";
        }

        if (!formData.subject.trim()) {
            newErrors.subject = "Subject is required";
        }

        if (!formData.message.trim()) {
            newErrors.message = "Message is required";
        } else if (formData.message.trim().length < 10) {
            newErrors.message = "Message must be at least 10 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            setIsSubmitting(true);

            // Simulate form submission
            setTimeout(() => {
                setIsSubmitting(false);
                setSubmitSuccess(true);

                // Reset form
                setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    company: "",
                    subject: "",
                    message: "",
                });

                // Hide success message after 5 seconds
                setTimeout(() => {
                    setSubmitSuccess(false);
                }, 5000);
            }, 1500);
        }
    };

    return (
        <div className="bg-gradient-to-b from-white to-slate-50">
            {/* Hero Section */}
            <section className="pt-20 sm:pt-24 pb-0">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                    <div className="text-center">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900">
                            Contact Us
                        </h1>
                        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                            We're here to help. Get in touch with our team
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-12 sm:py-16 md:py-20">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                        {/* Contact Information */}
                        <div className="lg:col-span-1 space-y-6">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
                                    Contact Information
                                </h2>
                                <p className="text-slate-600 mb-8">
                                    Reach out to us through any of these channels. We're available Monday to Friday, 9 AM to 6 PM IST.
                                </p>
                            </div>

                            {/* Contact Cards */}
                            <div className="space-y-4">
                                {/* Email */}
                                <div className="flex items-start gap-4 p-4 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 transition">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-[#4f46e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Email</h3>
                                        <a href="mailto:info@zynextro.com" className="text-slate-600 hover:text-[#4f46e5] transition">
                                            info@zynextro.com
                                        </a>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex items-start gap-4 p-4 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 transition">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-[#4f46e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Phone</h3>
                                        <a href="tel:+918882822733" className="text-slate-600 hover:text-[#4f46e5] transition">
                                            +91-8882822733
                                        </a>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="flex items-start gap-4 p-4 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 transition">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-[#4f46e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Office</h3>
                                        <p className="text-slate-600">
                                            No. 516, 5th floor, Tower B, Bhutani Alphathum, Plot No-1, Sector 90, Noida, Uttar Pradesh - 201305
                                        </p>
                                    </div>
                                </div>

                                {/* Business Hours */}
                                <div className="flex items-start gap-4 p-4 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 transition">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-[#4f46e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Working Hours</h3>
                                        <p className="text-slate-600">
                                            Mon - Fri: 10:00 AM - 7:00 PM<br />
                                            Sat - Sun: 10:00 AM - 4:00 PM
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-200">
                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
                                    Send us a Message
                                </h2>

                                {/* Success Message */}
                                {submitSuccess && (
                                    <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
                                        <div className="flex items-center gap-3">
                                            <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <p className="font-semibold text-green-900">Message sent successfully!</p>
                                                <p className="text-sm text-green-700">We'll get back to you as soon as possible.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="firstName" className="block text-sm font-semibold text-slate-900 mb-2">
                                                First Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="firstName"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 rounded-lg border ${errors.firstName ? "border-red-500" : "border-slate-300"
                                                    } focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition`}
                                                placeholder="John"
                                            />
                                            {errors.firstName && (
                                                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="lastName" className="block text-sm font-semibold text-slate-900 mb-2">
                                                Last Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="lastName"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 rounded-lg border ${errors.lastName ? "border-red-500" : "border-slate-300"
                                                    } focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition`}
                                                placeholder="Doe"
                                            />
                                            {errors.lastName && (
                                                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Email & Phone Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 rounded-lg border ${errors.email ? "border-red-500" : "border-slate-300"
                                                    } focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition`}
                                                placeholder="john@example.com"
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-semibold text-slate-900 mb-2">
                                                Phone <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 rounded-lg border ${errors.phone ? "border-red-500" : "border-slate-300"
                                                    } focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition`}
                                                placeholder="9876543210"
                                            />
                                            {errors.phone && (
                                                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Company */}
                                    <div>
                                        <label htmlFor="company" className="block text-sm font-semibold text-slate-900 mb-2">
                                            Company Name <span className="text-slate-400">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="company"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition"
                                            placeholder="Your Company"
                                        />
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-semibold text-slate-900 mb-2">
                                            Subject <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 rounded-lg border ${errors.subject ? "border-red-500" : "border-slate-300"
                                                } focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition`}
                                            placeholder="How can we help you?"
                                        />
                                        {errors.subject && (
                                            <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-semibold text-slate-900 mb-2">
                                            Message <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            rows={6}
                                            className={`w-full px-4 py-3 rounded-lg border ${errors.message ? "border-red-500" : "border-slate-300"
                                                } focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition resize-none`}
                                            placeholder="Tell us more about your inquiry..."
                                        />
                                        {errors.message && (
                                            <p className="mt-1 text-sm text-red-500">{errors.message}</p>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`w-full sm:w-auto px-8 py-4 rounded-lg font-semibold text-white transition-all ${isSubmitting
                                            ? "bg-slate-400 cursor-not-allowed"
                                            : "bg-gradient-to-r from-[#4f46e5] to-[#818cf8] hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5"
                                            }`}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Sending...
                                            </span>
                                        ) : (
                                            "Send Message"
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Contact;
