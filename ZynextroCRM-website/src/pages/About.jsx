import { Link } from 'react-router-dom';
import aboutBg from '../assets/about.png';

function About() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section
                style={{
                    backgroundImage: `url(${aboutBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative',
                }}
                className="pt-20 sm:pt-24 pb-16 sm:pb-24"
            >
                {/* Dark overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.82) 0%, rgba(30,27,75,0.70) 100%)',
                }} />

                <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6">
                    <div className="text-center">
                        <span className="inline-block bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                            Who We Are
                        </span>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
                            About Us
                        </h1>
                        <p className="mt-2 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
                            Transforming businesses through innovative CRM solutions
                        </p>
                    </div>

                    {/* Company Introduction */}
                    <div className="mt-12 max-w-4xl mx-auto">
                        <p className="text-base sm:text-lg text-slate-200 leading-relaxed text-center mb-10">
                            Zynextro CRM is a leading technology consulting firm dedicated to empowering businesses with cutting-edge customer relationship management solutions. Since our inception, we've been committed to helping organizations streamline their sales processes, enhance customer engagement, and drive sustainable growth through intelligent automation and data-driven insights.
                        </p>

                        {/* Key Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
                            <div className="text-center p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all">
                                <div className="w-12 h-12 bg-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-white mb-2">Innovation First</h3>
                                <p className="text-sm text-slate-300">Leveraging AI and automation to deliver next-generation CRM solutions</p>
                            </div>

                            <div className="text-center p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all">
                                <div className="w-12 h-12 bg-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-white mb-2">Customer Centric</h3>
                                <p className="text-sm text-slate-300">Your success is our priority, with dedicated support every step of the way</p>
                            </div>

                            <div className="text-center p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all">
                                <div className="w-12 h-12 bg-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-white mb-2">Proven Results</h3>
                                <p className="text-sm text-slate-300">Trusted by 500+ businesses to manage their customer relationships</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Story Timeline */}
            <section className="py-12 sm:py-16 md:py-20 bg-white">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                    <div className="text-center mb-8 sm:mb-12">
                        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-3 sm:mb-4">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs sm:text-sm font-semibold">Our Journey</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">The Zynextro Story</h2>
                        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-4">Building tomorrow's technology solutions today</p>
                    </div>

                    <div className="max-w-[1400px] mx-auto">
                        {/* Timeline */}
                        <div className="relative">
                            {/* Vertical Line - Hidden on mobile, shown on larger screens */}
                            <div className="hidden sm:block absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-600 via-indigo-400 to-indigo-200"></div>

                            {/* Timeline Items */}
                            <div className="space-y-6 sm:space-y-8">
                                {[
                                    {
                                        year: 'Jan 2025',
                                        title: 'The Beginning',
                                        description: 'Founded with a vision to bridge the gap between cutting-edge technology and business success. Started with a small team of passionate developers.'
                                    },
                                    {
                                        year: 'June 2025',
                                        title: 'Rapid Growth',
                                        description: 'Expanded our services across multiple industries. Established partnerships with global tech leaders and opened new offices.'
                                    },
                                    {
                                        year: 'Oct 2025',
                                        title: 'Digital Innovation',
                                        description: 'Led the digital transformation wave during global challenges. Helped hundreds of businesses adapt and thrive in the digital space.'
                                    },
                                    {
                                        year: '2026',
                                        title: 'Present Day',
                                        description: 'Today, we stand as a trusted partner to businesses worldwide, delivering comprehensive CRM solutions that not only meet current needs but prepare organizations for future challenges.'
                                    }
                                ].map((item, index) => (
                                    <div key={index} className="relative sm:pl-20">
                                        {/* Dot - Hidden on mobile */}
                                        <div className="hidden sm:block absolute left-6 top-6 w-5 h-5 rounded-full bg-indigo-600 border-4 border-white shadow-lg"></div>

                                        {/* Content */}
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:border-indigo-300 transition-all">
                                            <span className="inline-block bg-indigo-600 text-white text-xs sm:text-sm font-bold px-2.5 sm:px-3 py-1 rounded-full mb-2 sm:mb-3">{item.year}</span>
                                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                                            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 sm:py-16 bg-slate-50">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
                        {[
                            { number: '500+', label: 'Happy Clients' },
                            { number: '1000+', label: 'Projects Completed' },
                            { number: '50+', label: 'Expert Team Members' },
                            { number: '15+', label: 'Years Experience' }
                        ].map((stat, index) => (
                            <div key={index} className="p-4 sm:p-6">
                                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-indigo-600 mb-1 sm:mb-2">{stat.number}</div>
                                <div className="text-xs sm:text-sm md:text-base text-slate-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-12 sm:py-16 md:py-20 bg-white">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                    <div className="grid md:grid-cols-2 gap-6 sm:gap-8 sm:grid-cols-2">
                        {/* Mission */}
                        <div className="bg-slate-50 border border-indigo-300 rounded-2xl p-6 sm:p-8 hover:shadow-[0_4px_24px_rgba(99,102,241,0.25)] transition-all">
                            <div className="flex items-center gap-4 mb-4 sm:mb-5">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Our Mission</h3>
                            </div>
                            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                                To empower businesses with innovative CRM technology solutions that drive growth, enhance efficiency, and create sustainable competitive advantages in the digital age.
                            </p>
                        </div>

                        {/* Vision */}
                        <div className="bg-slate-50 border border-indigo-300 rounded-2xl p-6 sm:p-8 hover:shadow-[0_4px_24px_rgba(99,102,241,0.25)] transition-all">
                            <div className="flex items-center gap-4 mb-4 sm:mb-5">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Our Vision</h3>
                            </div>
                            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                                To be the global leader in CRM technology consulting, recognized for our innovation, expertise, and commitment to transforming businesses through technology.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-12 sm:py-16 md:py-20 bg-slate-50 overflow-hidden">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                    <div className="text-center mb-8 sm:mb-12">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">Our Core Values</h2>
                        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-4">The principles that guide everything we do</p>
                    </div>

                    {/* Infinite Scrolling Container */}
                    <div className="relative">
                        <div className="flex gap-6 animate-scroll">
                            {/* First set of cards */}
                            {[
                                {
                                    icon: (
                                        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    ),
                                    title: 'Innovation',
                                    description: 'We embrace cutting-edge technologies and creative thinking to deliver solutions that push boundaries and drive progress.'
                                },
                                {
                                    icon: (
                                        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    ),
                                    title: 'Integrity',
                                    description: 'We conduct business with honesty, transparency, and ethical practices, building trust with every interaction.'
                                },
                                {
                                    icon: (
                                        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                    ),
                                    title: 'Excellence',
                                    description: 'We strive for perfection in every project, maintaining the highest standards of quality and professionalism.'
                                },
                                {
                                    icon: (
                                        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    ),
                                    title: 'Collaboration',
                                    description: 'We work closely with our clients and team members, fostering partnerships that lead to shared success.'
                                },
                                {
                                    icon: (
                                        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    ),
                                    title: 'Customer Focus',
                                    description: 'Our clients\' success is our priority. We listen, understand, and deliver solutions that exceed expectations.'
                                },
                                {
                                    icon: (
                                        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    ),
                                    title: 'Continuous Learning',
                                    description: 'We invest in our team\'s growth and stay ahead of industry trends to provide the best solutions.'
                                }
                            ].map((value, index) => (
                                <div key={index} className="flex-shrink-0 w-80 bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all text-center">
                                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                                        {value.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">{value.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">{value.description}</p>
                                </div>
                            ))}
                            {/* Duplicate set for infinite scroll */}
                            {[
                                {
                                    icon: (
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    ),
                                    title: 'Innovation',
                                    description: 'We embrace cutting-edge technologies and creative thinking to deliver solutions that push boundaries and drive progress.'
                                },
                                {
                                    icon: (
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    ),
                                    title: 'Integrity',
                                    description: 'We conduct business with honesty, transparency, and ethical practices, building trust with every interaction.'
                                },
                                {
                                    icon: (
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                    ),
                                    title: 'Excellence',
                                    description: 'We strive for perfection in every project, maintaining the highest standards of quality and professionalism.'
                                },
                                {
                                    icon: (
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    ),
                                    title: 'Collaboration',
                                    description: 'We work closely with our clients and team members, fostering partnerships that lead to shared success.'
                                },
                                {
                                    icon: (
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    ),
                                    title: 'Customer Focus',
                                    description: 'Our clients\' success is our priority. We listen, understand, and deliver solutions that exceed expectations.'
                                },
                                {
                                    icon: (
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    ),
                                    title: 'Continuous Learning',
                                    description: 'We invest in our team\'s growth and stay ahead of industry trends to provide the best solutions.'
                                }
                            ].map((value, index) => (
                                <div key={`duplicate-${index}`} className="flex-shrink-0 w-80 bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all text-center">
                                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                                        {value.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">{value.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">{value.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6 text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4">Ready to Transform Your Business?</h2>
                    <p className="text-base sm:text-lg text-indigo-100 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
                        Join hundreds of successful businesses that trust Zynextro CRM for their growth.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                        <Link
                            to="/contact-us"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-bold hover:bg-indigo-50 transition-all hover:shadow-xl"
                        >
                            Get Started Today
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                        <Link
                            to="/pricing"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-bold hover:bg-white/20 transition-all"
                        >
                            View Pricing Plans
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default About;
