function PrivacyPolicy() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="pt-20 sm:pt-24 pb-0">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                    <div className="text-center">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900">
                            Privacy Policy
                        </h1>
                        <p className="mt-4 text-base sm:text-lg text-slate-600">
                            Last updated: December 26, 2024
                        </p>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-12 sm:py-16 md:py-20">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                    <div className="prose prose-slate max-w-none">
                        {/* Introduction */}
                        <div className="mb-12">
                            <p className="text-lg text-slate-600 leading-relaxed">
                                At Zynextro CRM, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our CRM services.
                            </p>
                        </div>

                        {/* 1. Information We Collect */}
                        <div className="mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>

                            <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">1.1 Information You Provide</h3>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                We collect information that you directly provide to us:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 mb-4">
                                <li><strong>Account Information:</strong> Name, email address, phone number, company name</li>
                                <li><strong>Profile Data:</strong> Job title, department, profile picture</li>
                                <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely through third-party providers)</li>
                                <li><strong>Customer Data:</strong> Contact information, interaction history, and other data you input into the CRM</li>
                                <li><strong>Communications:</strong> Messages, feedback, and support requests</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">1.2 Automatically Collected Information</h3>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                We automatically collect certain information when you use our services:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600">
                                <li><strong>Usage Data:</strong> Features used, pages visited, time spent, click patterns</li>
                                <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                                <li><strong>Log Data:</strong> Access times, error logs, performance data</li>
                                <li><strong>Cookies:</strong> Session cookies, preference cookies, analytics cookies</li>
                            </ul>
                        </div>

                        {/* 2. How We Use Your Information */}
                        <div className="mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">2. How We Use Your Information</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                We use the collected information for the following purposes:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600">
                                <li><strong>Service Delivery:</strong> Provide, maintain, and improve our CRM services</li>
                                <li><strong>Account Management:</strong> Create and manage your account, process payments</li>
                                <li><strong>Customer Support:</strong> Respond to inquiries, troubleshoot issues, provide assistance</li>
                                <li><strong>Communication:</strong> Send service updates, security alerts, and promotional materials (with your consent)</li>
                                <li><strong>Analytics:</strong> Analyze usage patterns to improve features and user experience</li>
                                <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security incidents</li>
                                <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our terms</li>
                            </ul>
                        </div>

                        {/* 3. Data Sharing and Disclosure */}
                        <div className="mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">3. Data Sharing and Disclosure</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                We do not sell your personal information. We may share your data in the following circumstances:
                            </p>

                            <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">3.1 Service Providers</h3>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                We work with trusted third-party service providers who assist us in:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 mb-4">
                                <li>Cloud hosting and infrastructure (AWS, Google Cloud)</li>
                                <li>Payment processing (Stripe, PayPal)</li>
                                <li>Email delivery and communications</li>
                                <li>Analytics and monitoring</li>
                                <li>Customer support tools</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">3.2 Legal Requirements</h3>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                We may disclose your information when required by law or to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600">
                                <li>Comply with legal processes or government requests</li>
                                <li>Enforce our Terms and Conditions</li>
                                <li>Protect our rights, property, or safety</li>
                                <li>Prevent fraud or security threats</li>
                            </ul>
                        </div>

                        {/* 4. Data Security */}
                        <div className="mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">4. Data Security</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                We implement industry-standard security measures to protect your data:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 mb-4">
                                <li><strong>Encryption:</strong> TLS/SSL encryption for data in transit, AES-256 encryption for data at rest</li>
                                <li><strong>Access Controls:</strong> Role-based access, multi-factor authentication</li>
                                <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                                <li><strong>Data Backups:</strong> Regular automated backups with disaster recovery procedures</li>
                                <li><strong>Employee Training:</strong> Security awareness and data protection training</li>
                            </ul>
                            <p className="text-slate-600 leading-relaxed">
                                While we strive to protect your data, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
                            </p>
                        </div>

                        {/* 5. Data Retention */}
                        <div className="mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">5. Data Retention</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                We retain your personal information for as long as necessary to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 mb-4">
                                <li>Provide our services to you</li>
                                <li>Comply with legal obligations</li>
                                <li>Resolve disputes and enforce agreements</li>
                                <li>Maintain business records</li>
                            </ul>
                            <p className="text-slate-600 leading-relaxed">
                                After account termination, we retain data for 30 days to allow for data recovery. After this period, data is permanently deleted unless required for legal compliance.
                            </p>
                        </div>

                        {/* 6. Your Rights and Choices */}
                        <div className="mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">6. Your Rights and Choices</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                You have the following rights regarding your personal data:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 mb-4">
                                <li><strong>Access:</strong> Request a copy of your personal data</li>
                                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                                <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                                <li><strong>Restriction:</strong> Limit how we process your data</li>
                                <li><strong>Objection:</strong> Object to certain data processing activities</li>
                            </ul>
                            <p className="text-slate-600 leading-relaxed">
                                To exercise these rights, please contact us at privacy@zynextro.com. We will respond within 30 days.
                            </p>
                        </div>

                        {/* 7. Cookies and Tracking */}
                        <div className="mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">7. Cookies and Tracking Technologies</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                We use cookies and similar technologies to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 mb-4">
                                <li><strong>Essential Cookies:</strong> Required for basic functionality and security</li>
                                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                                <li><strong>Analytics Cookies:</strong> Understand how you use our services</li>
                                <li><strong>Marketing Cookies:</strong> Deliver relevant advertisements (with consent)</li>
                            </ul>
                            <p className="text-slate-600 leading-relaxed">
                                You can control cookies through your browser settings. Disabling certain cookies may affect service functionality.
                            </p>
                        </div>

                        {/* 8. International Data Transfers */}
                        <div className="mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">8. International Data Transfers</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                Your data may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600">
                                <li>Standard Contractual Clauses approved by regulatory authorities</li>
                                <li>Data processing agreements with service providers</li>
                                <li>Compliance with GDPR, CCPA, and other data protection regulations</li>
                            </ul>
                        </div>

                        {/* 9. Children's Privacy */}
                        <div className="mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">9. Children's Privacy</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete it promptly.
                            </p>
                        </div>

                        {/* 10. Changes to Privacy Policy */}
                        <div className="mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">10. Changes to This Privacy Policy</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of significant changes by:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 mb-4">
                                <li>Email notification to your registered email address</li>
                                <li>Prominent notice on our website</li>
                                <li>In-app notifications</li>
                            </ul>
                            <p className="text-slate-600 leading-relaxed">
                                Your continued use of our services after changes are posted constitutes acceptance of the updated policy.
                            </p>
                        </div>

                        {/* 11. Contact Us */}
                        <div className="mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">11. Contact Us</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                            </p>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                                <p className="text-slate-700 mb-2"><strong>Data Protection Officer:</strong> privacy@zynextro.com</p>
                                <p className="text-slate-700 mb-2"><strong>Email:</strong> support@zynextro.com</p>
                                <p className="text-slate-700 mb-2"><strong>Phone:</strong> +91 120 456 7890</p>
                                <p className="text-slate-700"><strong>Address:</strong> Sector 62, Noida, Uttar Pradesh 201301, India</p>
                            </div>
                        </div>

                        {/* Compliance Statement */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mt-12">
                            <h3 className="text-lg font-semibold text-indigo-900 mb-3">Compliance Statement</h3>
                            <p className="text-indigo-800 text-sm leading-relaxed">
                                Zynextro CRM is committed to compliance with applicable data protection laws including the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and India's Information Technology Act. We regularly review and update our practices to ensure ongoing compliance.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default PrivacyPolicy;
