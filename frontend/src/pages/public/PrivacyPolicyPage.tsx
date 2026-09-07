import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    ShieldCheck, ArrowLeft, Globe, Lock,
    Eye, Database, UserCheck, Trash2, Mail, ExternalLink,
    FileText, CheckCircle2
} from 'lucide-react';

export default function PrivacyPolicyPage() {
    const [lang, setLang] = useState<'EN' | 'AM'>('EN');
    const isAm = lang === 'AM';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
            <Helmet>
                <title>{isAm ? 'የግላዊነት ፖሊሲ (Privacy Policy) — OurMenu' : 'Privacy Policy — OurMenu Ethiopia'}</title>
                <meta
                    name="description"
                    content="OurMenu Privacy Policy and Google API Services User Data Policy compliance disclosure."
                />
            </Helmet>

            {/* ─── Top Navigation Bar ─── */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/landing"
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Back to home"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <Link to="/landing" className="flex items-center gap-2">
                            <img
                                src="/logo.png"
                                alt="OurMenu"
                                className="w-8 h-8 rounded-xl shadow-md shadow-amber-500/20 object-contain"
                            />
                            <span className="font-extrabold text-white text-base tracking-tight">OurMenu</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Language Switcher */}
                        <button
                            type="button"
                            onClick={() => setLang(l => (l === 'EN' ? 'AM' : 'EN'))}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-colors"
                        >
                            <Globe className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isAm ? 'English' : 'አማርኛ'}</span>
                        </button>

                        <Link
                            to="/login"
                            className="hidden sm:inline-flex px-4 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all"
                        >
                            {isAm ? 'ግባ' : 'Sign In'}
                        </Link>
                    </div>
                </div>
            </header>

            {/* ─── Hero Header ─── */}
            <section className="py-12 sm:py-16 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/60 to-slate-950">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{isAm ? 'ሕጋዊ እና ደህንነት ማረጋገጫ' : 'Trust, Security & Legal Compliance'}</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {isAm ? 'የግላዊነት ፖሊሲ (Privacy Policy)' : 'OurMenu Privacy Policy'}
                    </h1>
                    <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-2xl">
                        {isAm
                            ? 'ይህ የግላዊነት ፖሊሲ የእርስዎን መረጃ እንዴት እንደምንሰበስብ፣ እንደምንጠቀም እና እንደምንጠብቅ እንዲሁም የGoogle OAuth መረጃ አጠቃቀም ደንቦችን በግልጽ ያብራራል።'
                            : 'This Privacy Policy explains how OurMenu collects, uses, and safeguards your information, including full disclosure on Google OAuth authentication and diner privacy.'}
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                        <span>{isAm ? 'የመጨረሻ ማሻሻያ፡ መስከረም 2026' : 'Last Updated: September 2026'}</span>
                        <span>•</span>
                        <span>{isAm ? 'ተፈጻሚነት፡ በሁሉም የOurMenu አገልግሎቶች' : 'Applies to ourmenu.et'}</span>
                    </div>
                </div>
            </section>

            {/* ─── Main Content ─── */}
            <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
                {/* 1. Overview */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                            1
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isAm ? '1. አጠቃላይ መግቢያ (Overview)' : '1. Overview & Scope'}
                        </h2>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        {isAm
                            ? 'OurMenu («እኛ» ወይም «አገልግሎታችን») በኢትዮጵያና በመላው ዓለም ለሚገኙ ሬስቶራንቶች፣ ካፌዎች እና ሆቴሎች ዘመናዊ የQR ዲጂታል ሜኑ አገልግሎት የሚሰጥ የቴክኖሎጂ መድረክ ነው። ይህ ፖሊሲ በድረ-ገጻችን (https://www.ourmenu.et)፣ በባለቤት ዳሽቦርድ እና በደንበኞች የሜኑ ገጾች ላይ ተፈጻሚ ይሆናል።'
                            : 'OurMenu ("we", "us", or "our") provides digital QR menu software and management platforms for restaurants, cafes, and hospitality businesses in Ethiopia and internationally via https://www.ourmenu.et. We respect your privacy and are committed to protecting the personal data of our users and their diners.'}
                    </p>
                </section>

                {/* 2. Google OAuth & Account Data */}
                <section className="space-y-4 p-6 rounded-3xl bg-slate-900/60 border border-amber-500/20">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs flex items-center justify-center">
                            2
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <span>{isAm ? '2. የGoogle መለያ መረጃ አጠቃቀም (Google OAuth Disclosure)' : '2. Google OAuth & Account Authentication Data'}</span>
                        </h2>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">
                        {isAm
                            ? 'በGoogle መለያዎ ወደ OurMenu ሲገቡ የሚከተሉትን መሰረታዊ መረጃዎች ብቻ ከGoogle እንቀበላለን፡'
                            : 'When you sign up or log in to OurMenu using Google Sign-In, we request and collect the following limited user data from Google:'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                            <span className="font-bold text-amber-400 block mb-1">Google User ID</span>
                            <span className="text-slate-300">A unique identifier provided by Google to verify your identity securely across sessions.</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                            <span className="font-bold text-amber-400 block mb-1">Email Address</span>
                            <span className="text-slate-300">Used as your primary login identifier, account communication, and billing notifications.</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                            <span className="font-bold text-amber-400 block mb-1">Full Name</span>
                            <span className="text-slate-300">Used to personalize your dashboard profile and restaurant management communications.</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                            <span className="font-bold text-amber-400 block mb-1">Profile Avatar URL</span>
                            <span className="text-slate-300">Used optionally to display your avatar in the admin dashboard navigation bar.</span>
                        </div>
                    </div>

                    {/* Google API Limited Use Requirements Callout */}
                    <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
                            <Lock className="w-4 h-4" />
                            <span>Google API Limited Use Compliance Notice</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            OurMenu’s use and transfer to any other app of information received from Google APIs adheres to the{' '}
                            <a
                                href="https://developers.google.com/terms/api-services-user-data-policy"
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-400 underline hover:text-amber-300 inline-flex items-center gap-0.5 font-bold"
                            >
                                Google API Services User Data Policy
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                            , including the Limited Use requirements. Specifically:
                        </p>
                        <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pl-1">
                            <li>We do <strong>NOT</strong> sell Google user data to any third party or data broker.</li>
                            <li>We do <strong>NOT</strong> use Google user data for advertising, marketing, or retargeting.</li>
                            <li>We do <strong>NOT</strong> allow humans to read user data unless explicitly requested by the user for technical troubleshooting.</li>
                        </ul>
                    </div>
                </section>

                {/* 3. Information Collected from Restaurants & Diners */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                            3
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isAm ? '3. የምንሰበስበው መረጃ (Information We Collect)' : '3. Information We Collect from Restaurants & Diners'}
                        </h2>
                    </div>

                    <div className="space-y-3 text-sm text-slate-300">
                        <p>
                            <strong>A. Restaurant Profile & Menu Content:</strong> Restaurant name, phone number, address, city, logo image, banner photos, category names, menu items, descriptions, prices, fasting food tags, and WiFi/payment details provided by the restaurant owner.
                        </p>
                        <p>
                            <strong>B. Diner Interaction Data (Privacy-Preserving & Anonymous):</strong> When customers scan a QR code at a table, we log anonymous foot-traffic metrics (scan timestamp, device category like Mobile/Tablet, language selected, and a one-way SHA-256 cryptographic hash of the IP to count unique daily visitors without storing raw personal identifiers). We do <em>not</em> track individual customer identities or install cookies on diner phones.
                        </p>
                    </div>
                </section>

                {/* 4. How We Use Information */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                            4
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isAm ? '4. መረጃን የምንጠቀምበት ዓላማ (How We Use Your Data)' : '4. How We Use Your Information'}
                        </h2>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-300">
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>To create, maintain, and authenticate your restaurant dashboard account.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>To generate and serve digital QR menus with fast caching and sub-second load times.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>To deliver transactional emails (such as 6-digit email verification codes and password reset OTPs).</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>To monitor system health, identify bugs, and maintain uptime through our automated diagnostic log tracker.</span>
                        </li>
                    </ul>
                </section>

                {/* 5. Data Sharing */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                            5
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isAm ? '5. መረጃን ለሶስተኛ ወገን አለማስተላለፍ (Data Sharing Policy)' : '5. Data Sharing & Third Parties'}
                        </h2>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        We do not sell, trade, or rent personal identification information to anyone. We only share information with trusted third-party infrastructure providers necessary to operate OurMenu:
                    </p>
                    <ul className="list-disc list-inside text-sm text-slate-400 space-y-1 pl-2">
                        <li><strong>Cloud Infrastructure & Database:</strong> PostgreSQL cloud hosting and high-availability database clusters under strict encryption at rest and in transit.</li>
                        <li><strong>Image Storage:</strong> S3-compatible cloud object storage for dish images and logos.</li>
                        <li><strong>Transactional Email Services:</strong> Providers (e.g. Resend / Brevo) used strictly to deliver verification OTP emails.</li>
                    </ul>
                </section>

                {/* 6. Data Retention & Deletion Rights */}
                <section className="space-y-4 p-6 rounded-3xl bg-slate-900/40 border border-slate-800">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                            6
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isAm ? '6. የመረጃ መሰረዝ መብት (Data Deletion & User Rights)' : '6. Data Retention & Account Deletion Rights'}
                        </h2>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        You have full control over your personal and restaurant data:
                    </p>
                    <div className="space-y-2 text-sm text-slate-300">
                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                            <strong>How to request account and data deletion:</strong> You can request immediate permanent deletion of your account, restaurant, categories, and dishes at any time by emailing{' '}
                            <a href="mailto:support@ourmenu.et" className="text-amber-400 font-bold hover:underline">support@ourmenu.et</a>{' '}
                            from your registered email address. We will permanently delete all your data within 7 business days.
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                            <strong>Revoking Google Access:</strong> You can disconnect OurMenu from your Google Account at any time via your{' '}
                            <a
                                href="https://myaccount.google.com/permissions"
                                target="_blank"
                                rel="noreferrer"
                                className="text-amber-400 underline font-bold inline-flex items-center gap-0.5"
                            >
                                Google Account Security Settings
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>.
                        </div>
                    </div>
                </section>

                {/* 7. Contact Us */}
                <section className="space-y-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-extrabold text-white">
                                {isAm ? 'ጥያቄ ወይም አስተያየት አለዎት?' : 'Questions or Privacy Requests?'}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                                Reach out directly to our privacy officer and support team.
                            </p>
                        </div>
                        <a
                            href="mailto:support@ourmenu.et"
                            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
                        >
                            <Mail className="w-4 h-4" />
                            <span>support@ourmenu.et</span>
                        </a>
                    </div>
                </section>
            </main>

            {/* ─── Footer ─── */}
            <footer className="py-8 bg-slate-950 border-t border-slate-900 text-xs text-slate-500">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p>© {new Date().getFullYear()} OurMenu Ethiopia. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <Link to="/terms" className="hover:text-amber-400 transition-colors">
                            Terms of Service
                        </Link>
                        <Link to="/privacy" className="text-white font-bold">
                            Privacy Policy
                        </Link>
                        <Link to="/landing" className="hover:text-white transition-colors">
                            Home
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
