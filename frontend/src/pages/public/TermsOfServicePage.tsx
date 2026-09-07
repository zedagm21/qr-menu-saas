import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    FileText, ArrowLeft, Globe, Shield,
    CheckCircle2, AlertCircle, Mail, ExternalLink,
    Store, DollarSign, Scale
} from 'lucide-react';

export default function TermsOfServicePage() {
    const [lang, setLang] = useState<'EN' | 'AM'>('EN');
    const isAm = lang === 'AM';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
            <Helmet>
                <title>{isAm ? 'የአገልግሎት ውል (Terms of Service) — OurMenu' : 'Terms of Service — OurMenu Ethiopia'}</title>
                <meta
                    name="description"
                    content="OurMenu Terms of Service governing platform usage, digital QR menu software, and account registration."
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
                        <Scale className="w-3.5 h-3.5" />
                        <span>{isAm ? 'የአጠቃቀም ሕጋዊ ውል' : 'Platform Agreement & Legal Terms'}</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {isAm ? 'የአገልግሎት ውል (Terms of Service)' : 'OurMenu Terms of Service'}
                    </h1>
                    <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-2xl">
                        {isAm
                            ? 'ይህ የአገልግሎት ውል የእርስዎን እና የOurMenuን ሕጋዊ መብቶች እና ግዴታዎች ይደነግጋል። አገልግሎታችንን በመጠቀም በዚህ ውል ይስማማሉ።'
                            : 'These Terms of Service govern your access to and use of OurMenu digital QR menu software, dashboard tools, and diner viewing services.'}
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                        <span>{isAm ? 'የመጨረሻ ማሻሻያ፡ መስከረም 2026' : 'Last Updated: September 2026'}</span>
                        <span>•</span>
                        <span>{isAm ? 'ተፈጻሚነት፡ በሁሉም ተጠቃሚዎች ላይ' : 'Applies to all users & restaurants'}</span>
                    </div>
                </div>
            </section>

            {/* ─── Main Content ─── */}
            <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
                {/* 1. Acceptance */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                            1
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isAm ? '1. ውልን ስለመቀበል (Acceptance of Terms)' : '1. Acceptance of Terms'}
                        </h2>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        By creating an account, registering a restaurant, signing in via Google, or scanning and browsing an OurMenu digital menu, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, do not access or use OurMenu.
                    </p>
                </section>

                {/* 2. Description of Service */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                            2
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isAm ? '2. የአገልግሎቱ አይነት (Description of Services)' : '2. Description of Services'}
                        </h2>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        OurMenu provides an interactive SaaS platform enabling hospitality operators (restaurants, cafes, lounges, bars, and hotels) to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-slate-400 space-y-1 pl-2">
                        <li>Create, customize, translate, and manage bilingual digital menus (English & Amharic).</li>
                        <li>Generate high-resolution printable QR codes linked to table numbers or main restaurant handles.</li>
                        <li>Provide diners with fast, responsive digital menu viewing, item search, allergen tags, fasting filters, and order tray aggregation.</li>
                        <li>Access foot-traffic analytics, scan trends, and dish demand metrics.</li>
                    </ul>
                </section>

                {/* 3. Account Registration & Google Authentication */}
                <section className="space-y-4 p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                            3
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isAm ? '3. አካውንት እና የGoogle ምዝገባ (Account & Authentication)' : '3. Account Registration & Google Authentication'}
                        </h2>
                    </div>
                    <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                        <p>
                            You may register using your email and password or by authenticating with your Google Account. You agree to provide accurate, truthful information and maintain the security of your credentials.
                        </p>
                        <p>
                            When using Google Sign-In, you authorize OurMenu to verify your identity using your Google email and profile data in accordance with our Privacy Policy. You are responsible for all activities that occur under your account.
                        </p>
                    </div>
                </section>

                {/* 4. Subscriptions, Trials & Billing */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                            4
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isAm ? '4. የክፍያ እና የነጻ ሙከራ ሁኔታዎች (Subscriptions & Billing)' : '4. Subscription Tiers, Free Trial & Billing'}
                        </h2>
                    </div>
                    <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                        <p>
                            <strong>14-Day Free Trial:</strong> New restaurant accounts receive a complimentary 14-day full-access trial of OurMenu. No credit card or prepayment is required to initiate the trial.
                        </p>
                        <p>
                            <strong>Paid Plans:</strong> After the trial period, continuous public menu hosting and advanced features require an active subscription tier (Starter or Pro). Fees are quoted in Ethiopian Birr (ETB) and are payable annually or on designated billing intervals.
                        </p>
                        <p>
                            <strong>Cancellation:</strong> You may cancel or pause your subscription at any time without penalty. Suspended restaurants remain saved in your account but public QR menus will display a status message.
                        </p>
                    </div>
                </section>

                {/* 5. Restaurant Content & Food Safety */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                            5
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isAm ? '5. የሜኑ መረጃ እና ኃላፊነት (Menu Accuracy & Food Safety)' : '5. Restaurant Content & Food Safety Obligations'}
                        </h2>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Restaurant owners bear sole responsibility for the accuracy of their menu items, descriptions, ingredient lists, prices, and allergen disclosures.
                    </p>
                    <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-slate-300 leading-relaxed">
                        <strong className="text-amber-400 block mb-1">Diner Allergy & Price Notice:</strong>
                        OurMenu is a technology software platform and does not prepare, handle, or verify food items. Diners with severe food allergies must always confirm ingredients directly with restaurant waitstaff.
                    </div>
                </section>

                {/* 6. Intellectual Property */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                            6
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isAm ? '6. የባለቤትነት መብት (Intellectual Property)' : '6. Intellectual Property & Ownership'}
                        </h2>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        <strong>Your Content:</strong> You retain 100% intellectual property ownership of all logos, dish photographs, descriptions, and trademarks you upload to OurMenu.
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        <strong>OurMenu Platform:</strong> OurMenu, our logos, software code, QR design algorithms, user interface, and branding are the proprietary property of OurMenu and are protected by applicable intellectual property laws.
                    </p>
                </section>

                {/* 7. Limitation of Liability */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                            7
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isAm ? '7. የኃላፊነት ወሰን (Limitation of Liability)' : '7. Limitation of Liability & Service Availability'}
                        </h2>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        OurMenu strives for 99.9% uptime, but services are provided on an "as-is" and "as-available" basis. We are not liable for indirect, incidental, or consequential damages resulting from network outages, third-party hosting interruptions, or unauthorized access to your account.
                    </p>
                </section>

                {/* 8. Governing Law */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                            8
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isAm ? '8. ተፈጻሚ ሕግ (Governing Law)' : '8. Governing Law & Jurisdiction'}
                        </h2>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        These Terms of Service are governed by and construed in accordance with the laws of the Federal Democratic Republic of Ethiopia. Any dispute arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Addis Ababa, Ethiopia.
                    </p>
                </section>

                {/* 9. Contact */}
                <section className="space-y-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-extrabold text-white">
                                {isAm ? 'የውል ጥያቄዎች አሉዎት?' : 'Questions Regarding These Terms?'}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                                Contact our legal and administrative team.
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
                        <Link to="/terms" className="text-white font-bold">
                            Terms of Service
                        </Link>
                        <Link to="/privacy" className="hover:text-amber-400 transition-colors">
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
