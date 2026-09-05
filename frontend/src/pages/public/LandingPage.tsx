import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    QrCode,
    Sparkles,
    Smartphone,
    Languages,
    Zap,
    Printer,
    Camera,
    BarChart3,
    ArrowRight,
    Check,
    ChevronDown,
    ChevronUp,
    Utensils,
    ExternalLink,
    PhoneCall,
    Share2,
    Calendar,
    Infinity as InfinityIcon,
    CheckCircle2,
    HelpCircle,
    Receipt,
    Wifi
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface SampleDish {
    id: string;
    nameEn: string;
    nameAm: string;
    descEn: string;
    descAm: string;
    price: number;
    isFasting: boolean;
    badgeEn: string;
    badgeAm: string;
    category: string;
}

export default function LandingPage() {
    const [lang, setLang] = useState<'EN' | 'AM'>('AM'); // Default to Amharic for Ethiopian target audience
    const [previewLang, setPreviewLang] = useState<'EN' | 'AM'>('AM');
    const [fastingOnly, setFastingOnly] = useState<boolean>(false);
    const [cartCount, setCartCount] = useState<number>(2);
    const [cartTotal, setCartTotal] = useState<number>(670);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
    const [pricingBilling, setPricingBilling] = useState<'ANNUAL' | 'LIFETIME'>('ANNUAL');

    const isAm = lang === 'AM';

    const liveDemoSlug = 'vista-cafe-restaurant';
    const demoUrl = `${window.location.origin}/r/${liveDemoSlug}`;

    const sampleDishes: SampleDish[] = [
        {
            id: '1',
            nameEn: 'Special Clay Tibs',
            nameAm: 'ልዩ የሸክላ ጥብስ',
            descEn: 'Tender beef cubes sautéed with rosemary, red onions & spiced awaze',
            descAm: 'በለስላሳ የበሬ ሥጋ፣ በቅቤ፣ በሚጥሚጣና በሮዝመሪ በሸክላ ድስት የቀረበ',
            price: 450,
            isFasting: false,
            badgeEn: "Chef's Special",
            badgeAm: 'የሼፉ ምርጫ',
            category: 'mains',
        },
        {
            id: '2',
            nameEn: 'Shiro Tegamino',
            nameAm: 'ሽሮ ተጋቢኖ',
            descEn: 'Slow-simmered spiced chickpea stew bubbling in traditional clay pot',
            descAm: 'በሸክላ ድስት የሚንተከተክ ምርጥ የጾም ሽሮ ከቃሪያና ሽንኩርት ጋር',
            price: 220,
            isFasting: true,
            badgeEn: 'Fasting / የጾም',
            badgeAm: 'የጾም',
            category: 'fasting',
        },
        {
            id: '3',
            nameEn: 'Special Macchiato & Pastry',
            nameAm: 'ስፔሻል ማኪያቶ ከኬክ ጋር',
            descEn: 'Double shot Sidama espresso layered with creamy steamed foam',
            descAm: 'የሲዳማ ቡና ማኪያቶ ከተመረጡ ትኩስ ኬኮች ጋር',
            price: 95,
            isFasting: false,
            badgeEn: 'Morning Favorite',
            badgeAm: 'የጠዋት ተመራጭ',
            category: 'drinks',
        },
        {
            id: '4',
            nameEn: 'Mango Avocado Layered Juice',
            nameAm: 'ማንጎ አቮካዶ ስፔሻል ጭማቂ',
            descEn: 'Freshly pressed organic tropical fruit layers with a dash of lime',
            descAm: 'ትኩስ የተጨመቀ የተፈጥሮ ማንጎና አቮካዶ ጭማቂ ከሎሚ ጋር',
            price: 180,
            isFasting: true,
            badgeEn: 'Pure Natural',
            badgeAm: 'ተፈጥሯዊ',
            category: 'drinks',
        },
    ];

    const displayedDishes = fastingOnly ? sampleDishes.filter((d) => d.isFasting) : sampleDishes;

    const handleAddToCart = (price: number) => {
        setCartCount((prev) => prev + 1);
        setCartTotal((prev) => prev + price);
    };

    const faqs = [
        {
            qEn: 'Do diners in Ethiopia need to download an app or have high-speed Wi-Fi?',
            qAm: 'ደንበኞች ሜኑውን ለማየት አፕሊኬሽን ማውረድ ወይም ከፍተኛ የኢንተርኔት ፍጥነት ያስፈልጋቸዋል?',
            aEn: 'No app download is needed whatsoever! Diners simply point their standard phone camera (iPhone or Android) at the QR stand. The menu is ultra-optimized and loads in under 1 second, even on regular 3G/4G Ethio Telecom or Safaricom mobile data.',
            aAm: 'ምንም ዓይነት አፕሊኬሽን ማውረድ አያስፈልግም! ደንበኞች በስልካቸው ካሜራ የጠረጴዛውን QR ኮድ ሲያነቡ ከ1 ሰከንድ ባነሰ ጊዜ ውስጥ በቀጥታ ይከፈታል። በኢትዮ ቴሌኮም ወይም ሳፋሪኮም መደበኛ የሞባይል ዳታ በከፍተኛ ፍጥነት ይሰራል፤ ከመስመር ውጭም (Offline) ሜኑው አይጠፋም።',
        },
        {
            qEn: 'Can we pay via Telebirr or CBE Birr instead of international credit cards?',
            qAm: 'ክፍያውን በቴሌብር (Telebirr) ወይም በኢትዮጵያ ንግድ ባንክ (CBE) መክፈል እንችላለን?',
            aEn: 'Yes! We support direct Ethiopian payment methods: Telebirr, CBE Birr, Awash, Bank of Abyssinia, and direct bank transfers. No foreign credit card is required. You can also start with our 14-day free trial first.',
            aAm: 'አዎ! ክፍያዎን በቴሌብር (Telebirr)፣ በኢትዮጵያ ንግድ ባንክ (CBE Birr)፣ በአዋሽ ወይም በአቢሲንያ ባንክ በቀላሉ መክፈል ይችላሉ። ምንም ዓይነት የውጭ ክሬዲት ካርድ አያስፈልግዎትም። በተጨማሪም በ14 ቀናት ነጻ ሙከራ ወዲያውኑ መጀመር ይችላሉ።',
        },
        {
            qEn: 'How does this solve menu re-printing costs when food prices change?',
            qAm: 'የምግብና መጠጥ ዋጋ በየጊዜው ሲቀየር የወረቀት ሜኑ ህትመት ወጪን እንዴት ያድናል?',
            aEn: 'With inflation, restaurant owners in Ethiopia spend 10,000 to 20,000+ ETB every time prices adjust to print new laminated menus. With OurMenu, you simply open your phone dashboard, type the new price or mark an item sold out, and tap save. It updates on all tables in 2 seconds at 0 Birr additional cost!',
            aAm: 'በአሁኑ ወቅት የዋጋ ማስተካከያ በተደረገ ቁጥር አዲስ የወረቀት ሜኑ ለማሳተም ከ10,000 እስከ 20,000+ ብር ይወጣል። በOurMenu በስልክዎ ዳሽቦርድ ላይ አዲሱን ዋጋ ጽፈው ሲቀይሩ በሁሉም ጠረጴዛዎች ላይ ወዲያውኑ በ2 ሰከንድ ውስጥ ያለ ምንም ተጨማሪ ወጪ ይቀየራል!',
        },
        {
            qEn: 'How does the Fasting (የጾም) feature work during Ethiopian fasting seasons?',
            qAm: 'በጾም ወቅት (አቢይ ጾም፣ ረቡዕና አርብ) የጾም ምግብ ማጣሪያው እንዴት ይሰራል?',
            aEn: 'Every dish can be tagged as Fasting (የጾም) or Non-Fasting. Diners simply tap the "🌿 Fasting Only / የጾም ምግብ ብቻ" button at the top of the menu, and all non-fasting dishes disappear instantly. Waiters never have to answer "የጾም ምግብ ምን አለ?" a hundred times a day.',
            aAm: 'እያንዳንዱን ምግብ የጾም ወይም የፍስክ ብለው ይመድባሉ። ደንበኞች በሜኑው አናት ላይ ያለውን «የጾም ምግብ ብቻ» አዝራር ሲጫኑ የፍስክ ምግቦች በሙሉ ተደብቀው የጾም ብቻ ይታያሉ። አስተናጋጆች «የጾም ምን አለ?» ለሚለው ተደጋጋሚ ጥያቄ ጊዜ አያባክኑም።',
        },
        {
            qEn: 'How do we print the QR codes for our restaurant tables?',
            qAm: 'የጠረጴዛ QR ኮዶችን እንዴት አትመን እናዘጋጃለን?',
            aEn: 'OurMenu generates high-resolution, print-ready table cards and A4 sheets directly from your dashboard. You can download them with your restaurant logo, table numbers (Table 1, Table 2, etc.), and send them to any local print shop or laminate them directly.',
            aAm: 'OurMenu ከዳሽቦርድዎ ላይ በቀጥታ ለህትመት ዝግጁ የሆኑ የጠረጴዛ QR ካርዶችን ከነጠረጴዛ ቁጥራቸው (ጠረጴዛ 1፣ 2...) እና ከሬስቶራንትዎ አርማ (ሎጎ) ጋር ያዘጋጅልዎታል። በA4 ሉህ አትመው ላሚኔት ማድረግ ወይም በማንኛውም የህትመት ቤት ማሳተም ይችላሉ።',
        },
        {
            qEn: 'What is the difference between the 2,999 ETB/year and 9,999 ETB One-Time plans?',
            qAm: 'በዓመታዊው (2,999 ብር) እና በአንድ ጊዜ ክፍያ (9,999 ብር) መካከል ያለው ልዩነት ምንድን ነው?',
            aEn: 'Both plans provide 100% of OurMenu features (unlimited dishes, bilingual English/Amharic, WhatsApp ordering, analytics, QR generator). The 2,999 ETB/year plan renews annually (~250 ETB/month). The 9,999 ETB One-Time plan gives you lifetime access with no renewals or recurring fees ever.',
            aAm: 'ሁለቱም እቅዶች ሁሉንም የOurMenu አገልግሎቶች (ያልተገደበ የምግብ ዝርዝር፣ አማርኛና እንግሊዝኛ፣ የዋትስአፕ ማዘዣ፣ የህትመት ዝግጅት) ያካተቱ ናቸው። የ2,999 ብር እቅድ በየዓመቱ የሚታደስ ሲሆን፣ የ9,999 ብር እቅድ ግን የአንድ ጊዜ ክፍያ ብቻ በመክፈል ለዘለቄታው ያለ ምንም ተጨማሪ ወርሃዊ ወይም ዓመታዊ ክፍያ የሚጠቀሙበት ነው።',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-sans antialiased">
            <Helmet>
                <title>
                    {isAm
                        ? 'OurMenu — የኢትዮጵያ ምርጥ የQR ዲጂታል ሜኑ መድረክ ለካፌዎችና ሬስቶራንቶች'
                        : 'OurMenu — Premium QR Digital Menu Platform for Ethiopian Restaurants & Cafes'}
                </title>
                <meta
                    name="description"
                    content="Modern digital QR menus for cafes, restaurants, and lounges in Ethiopia. Bilingual English & Amharic, fasting filters, WhatsApp table ordering, and instant price updates without printing costs."
                />
            </Helmet>

            {/* ─── Top Announcement Banner ─── */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 px-4 py-2 text-center text-xs font-black tracking-wide">
                <span>
                    {isAm
                        ? '🇪🇹 ለኢትዮጵያ ካፌዎች፣ ባህላዊ ሬስቶራንቶችና ላውንጆች የተዘጋጀ • የ14 ቀናት ነጻ ሙከራ ይጀምሩ!'
                        : '🇪🇹 Purpose-Built for Ethiopian Cafes, Cultural Restaurants & Lounges • Start 14-Day Free Trial!'}
                </span>
            </div>

            {/* ─── Top Navigation Bar ─── */}
            <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Brand Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                            <QrCode className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                                Our<span className="text-amber-400">Menu</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 ml-1">
                                    ET
                                </span>
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
                        <a href="#why-ourmenu" className="hover:text-amber-400 transition-colors">
                            {isAm ? 'ለምን OurMenu?' : 'Why OurMenu?'}
                        </a>
                        <a href="#demo" className="hover:text-amber-400 transition-colors">
                            {isAm ? 'ቀጥታ ማሳያ' : 'Live Demo'}
                        </a>
                        <a href="#features" className="hover:text-amber-400 transition-colors">
                            {isAm ? 'ባህሪያት' : 'Features'}
                        </a>
                        <a href="#pricing" className="hover:text-amber-400 transition-colors">
                            {isAm ? 'ዋጋዎች' : 'Pricing'}
                        </a>
                        <a href="#faq" className="hover:text-amber-400 transition-colors">
                            {isAm ? 'ጥያቄዎች' : 'FAQ'}
                        </a>
                    </nav>

                    {/* Actions: Language Switch & Auth Buttons */}
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                const nextLang = lang === 'EN' ? 'AM' : 'EN';
                                setLang(nextLang);
                                setPreviewLang(nextLang);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-amber-400 flex items-center gap-1.5 transition-all"
                            title="Switch Language"
                        >
                            <Languages className="w-3.5 h-3.5" />
                            <span>{lang === 'EN' ? 'አማርኛ' : 'English'}</span>
                        </button>

                        <Link
                            to="/login"
                            className="text-xs sm:text-sm font-bold text-slate-300 hover:text-white px-2.5 py-2 transition-colors"
                        >
                            {isAm ? 'ግባ' : 'Sign In'}
                        </Link>

                        <Link
                            to="/register"
                            className="px-3.5 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-extrabold shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                            <span>{isAm ? 'በነጻ ጀምር' : 'Start Free'}</span>
                            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* ─── Hero Section ─── */}
            <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    {/* Top Tagline Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-6 animate-fade-in shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                            {isAm
                                ? 'የወረቀት ህትመት ወጪን አስቁመው ሬስቶራንትዎን ዘመናዊ ያድርጉ'
                                : 'End Paper Printing Costs. Elevate Your Ethiopian Restaurant.'}
                        </span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
                        {isAm ? (
                            <>
                                የሬስቶራንትዎን የወረቀት ሜኑ ወደ{' '}
                                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                                    ፈጣን የQR ዲጂታል ሜኑ
                                </span>{' '}
                                ይቀይሩ
                            </>
                        ) : (
                            <>
                                Replace Paper Menus With Fast, Modern{' '}
                                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                                    Bilingual QR Menus
                                </span>
                            </>
                        )}
                    </h1>

                    {/* Subhead with Local Ethiopian Context */}
                    <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
                        {isAm
                            ? 'የምግብና መጠጥ ዋጋ ሲቀየር አዲስ ወረቀት ማሳተም አያስፈልግዎትም! በ2 ሰከንድ ከስልክዎ ዋጋዎችን ይቀይሩ። ደንበኞች በስልካቸው ካሜራ ስካን በማድረግ ሜኑዎን በአማርኛና እንግሊዝኛ ያያሉ፤ የጾም ምግቦችን በቀላሉ ይለያሉ።'
                            : 'Never spend 15,000+ ETB re-printing paper menus when prices change. Update prices in 2 seconds from your phone. Diners scan with their camera for instant English & Amharic menus with 1-tap Fasting (የጾም) filters and WhatsApp table ordering.'}
                    </p>

                    {/* Call to Actions */}
                    <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                        <Link
                            to="/register"
                            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span>{isAm ? 'የ14 ቀን ነጻ ሙከራ ጀምር' : 'Start 14-Day Free Trial'}</span>
                            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </Link>

                        <a
                            href="#demo"
                            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            <span>{isAm ? 'ቀጥታ ማሳያ ይመልከቱ' : 'Interactive Demo'}</span>
                            <Smartphone className="w-4 h-4 text-amber-400" />
                        </a>
                    </div>

                    {/* Local Ethiopian Trust Highlights */}
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-semibold text-slate-400">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-400" />
                            <span>{isAm ? 'ምንም ክሬዲት ካርድ አያስፈልግም' : 'No credit card needed'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-400" />
                            <span>{isAm ? 'ቴሌብር (Telebirr) እና CBE Birr ድጋፍ' : 'Telebirr & CBE Birr Supported'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-400" />
                            <span>{isAm ? 'በ5 ደቂቃ ውስጥ የሚዘጋጅ' : '5-minute instant setup'}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Local Pain Points vs OurMenu Solution (Engineered for Ethiopia) ─── */}
            <section id="why-ourmenu" className="py-16 sm:py-24 bg-slate-900/30 border-y border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
                            {isAm ? 'የኢትዮጵያ ካፌዎችና ሬስቶራንቶች ችግር እና መፍትሔ' : 'Built Specifically for the Ethiopian Market'}
                        </h2>
                        <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                            {isAm
                                ? 'የወረቀት ሜኑ ችግሮችን በOurMenu በቀላሉ ይፍቱ'
                                : 'Solve Everyday Restaurant Challenges with Modern Tech'}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Pain Point 1: Inflation & Print Costs */}
                        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6">
                                    <Receipt className="w-6 h-6 stroke-[2.2]" />
                                </div>
                                <h4 className="text-lg font-black text-white mb-2">
                                    {isAm ? 'የወረቀት ሜኑ ህትመት ወጪን ማቆም' : 'Zero Printing Costs on Price Updates'}
                                </h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {isAm
                                        ? 'የስጋ፣ የቅቤ ወይም የቡና ዋጋ ሲጨምር አዲስ ወረቀት ሜኑ ለማሳተም በየጊዜው ከ15,000 ብር በላይ ማውጣት ቀረ! በOurMenu በስልክዎ በ2 ሰከንድ ውስጥ ዋጋዎችን ይቀይሩ።'
                                        : 'When ingredient or supply costs rise, you no longer need to spend 15,000+ ETB reprinting laminated menus. Update any dish price or daily special from your phone in 2 seconds.'}
                                </p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                <span>{isAm ? 'በዓመት በአስር ሺዎች የሚቆጠር ብር ይቆጥቡ' : 'Saves tens of thousands of ETB yearly'}</span>
                            </div>
                        </div>

                        {/* Pain Point 2: Fasting Seasons (Tsom) */}
                        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                                    <Utensils className="w-6 h-6 stroke-[2.2]" />
                                </div>
                                <h4 className="text-lg font-black text-white mb-2">
                                    {isAm ? 'የጾም ወቅቶች (ረቡዕ፣ አርብ እና አቢይ ጾም)' : '1-Tap Fasting (የጾም) Season Ready'}
                                </h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {isAm
                                        ? 'በጾም ቀናት ደንበኞች በ1 ንክኪ የጾም ምግቦችን ብቻ ለይተው ያያሉ። አስተናጋጆችዎ ደጋግመው "የጾም ምግብ ምን አለ?" እያሉ ማብራራት ሳያስፈልጋቸው ደንበኞች ወዲያውኑ ይመርጣሉ።'
                                        : 'Ethiopian dining revolves around fasting days. Diners tap "Fasting Only" and non-fasting items disappear instantly. Waiters save time and diners get immediate clarity.'}
                                </p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                <span>{isAm ? 'ለጾም ደንበኞች ፈጣንና ግልጽ አገልግሎት' : 'Instant clarity for fasting diners'}</span>
                            </div>
                        </div>

                        {/* Pain Point 3: Peak Rush Hours & Waiter Load */}
                        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6">
                                    <PhoneCall className="w-6 h-6 stroke-[2.2]" />
                                </div>
                                <h4 className="text-lg font-black text-white mb-2">
                                    {isAm ? 'የምሳ ሰዓት መጨናነቅ እና ፈጣን ማዘዣ' : 'Faster Table Turns & WhatsApp Orders'}
                                </h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {isAm
                                        ? 'በምሳ ሰዓት ደንበኞች አስተናጋጅ ሜኑ እስኪያመጣ አይጠብቁም። ወዲያውኑ ስካን አድርገው ምግቦችን ከነፎቷቸውና ዋጋቸው አይተው በጠረጴዛ ቁጥራቸው በዋትስአፕ ወይም ለአስተናጋጅ ያዛሉ።'
                                        : 'During busy lunch rushes around Bole, Kazanchis, or Piassa, diners don’t wait for paper menus. They scan immediately, view dishes, and build orders with their table number.'}
                                </p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                <span>{isAm ? 'አስተናጋጆችን የሚያግዝ ዘመናዊ አሰራር' : 'Empowers waiters and speeds up table turnover'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Interactive Live Preview (Normal Display without theme switchers) ─── */}
            <section id="demo" className="py-16 sm:py-24 bg-slate-950 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>{isAm ? 'የቀጥታ ስልጠና እና ማሳያ' : 'Live Interactive Demo'}</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                            {isAm ? 'የደንበኛውን ገጽታ በቀጥታ ይሞክሩ' : 'Experience the Diner Menu in Real Time'}
                        </h2>
                        <p className="mt-3 text-sm sm:text-base text-slate-400">
                            {isAm
                                ? 'በስልኩ ላይ ያሉትን ምግቦች ይመልከቱ፣ «የጾም ምግብ ብቻ» የሚለውን ይጫኑ ወይም በስልክዎ ካሜራ የQR ኮዱን ስካን በማድረግ በስልክዎ ይክፈቱት!'
                                : 'Interact with the live phone menu below, test the Fasting filter, or point your smartphone camera at the QR code to open it live on your own device.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
                        {/* Left Side: Real Test QR Code & Instructions (5 Cols) */}
                        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
                            {/* Live Phone Scan Card */}
                            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center w-full max-w-sm mx-auto lg:mx-0">
                                <div className="p-3.5 bg-white rounded-2xl shadow-xl border-4 border-amber-500/40 relative group">
                                    <QRCodeSVG
                                        value={demoUrl}
                                        size={180}
                                        level="M"
                                        includeMargin={false}
                                    />
                                    <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-slate-950 text-[10px] font-black text-amber-400 border border-amber-500/50 shadow">
                                        SCAN ME
                                    </div>
                                </div>
                                <span className="mt-4 text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                    <Camera className="w-4 h-4 text-amber-400" />
                                    {isAm ? 'በስልክዎ ካሜራ ስካን ያድርጉ' : 'Scan with your smartphone camera'}
                                </span>
                                <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">
                                    {isAm
                                        ? 'ማንኛውም ስማርትፎን ይደግፋል፤ አፕሊኬሽን ማውረድ አያስፈልግም'
                                        : 'Zero apps to install. Instant loading on iOS & Android.'}
                                </p>
                                <a
                                    href={demoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 text-xs text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 transition-colors underline-offset-4 hover:underline"
                                >
                                    <span>{isAm ? 'በአሳሽ ለመክፈት ይጫኑ' : 'Or open live menu in new tab'}</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>

                            {/* Language Selector for Live Preview */}
                            <div className="w-full max-w-sm p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                                <div className="text-left">
                                    <span className="text-xs font-bold text-white block">
                                        {isAm ? 'የማሳያ ቋንቋ ይቀይሩ' : 'Preview Language'}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                        {isAm ? 'ሁለቱንም ቋንቋዎች በአንድ ክሊክ' : 'Instant bilingual Ge\'ez switch'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setPreviewLang(previewLang === 'EN' ? 'AM' : 'EN')}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-extrabold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                    <Languages className="w-3.5 h-3.5" />
                                    <span>{previewLang === 'EN' ? '🇪🇹 አማርኛ' : '🇬🇧 English'}</span>
                                </button>
                            </div>

                            {/* How It Works Steps */}
                            <div className="w-full max-w-sm space-y-2 text-left text-xs font-semibold text-slate-300">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">1</div>
                                    <span>{isAm ? 'ደንበኛው ጠረጴዛው ላይ ያለውን QR ስካን ያደርጋል' : 'Diner scans table QR stand'}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">2</div>
                                    <span>{isAm ? 'ሜኑው በሰከንድ ውስጥ በስልኩ ይከፈታል' : 'Menu opens in <1s in browser'}</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">3</div>
                                    <span>{isAm ? 'የፈለገውን መርጦ ለአስተናጋጅ ወይም በዋትስአፕ ያዛል' : 'Selects dishes & orders easily'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Realistic Phone Mockup (Normal Display) */}
                        <div className="lg:col-span-7 flex justify-center">
                            <div className="w-full max-w-[340px] sm:max-w-[380px] rounded-[44px] bg-slate-950 p-3.5 border-4 border-slate-700/80 shadow-[0_0_70px_rgba(245,158,11,0.18)] relative">
                                {/* Phone Top Speaker Notch */}
                                <div className="w-36 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-slate-900 mr-2" />
                                    <div className="w-10 h-1 rounded-full bg-slate-700" />
                                </div>

                                {/* Phone Inner Screen */}
                                <div className="rounded-[32px] overflow-hidden bg-neutral-900 text-neutral-100 p-4 min-h-[520px] flex flex-col justify-between border border-neutral-800 shadow-inner">
                                    {/* Mock Restaurant Branding Header */}
                                    <div>
                                        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-black text-xs shadow">
                                                    VC
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-black text-white flex items-center gap-1">
                                                        <span>{previewLang === 'AM' ? 'ቪስታ ካፌ እና ሬስቶራንት' : 'VISTA Cafe & Restaurant'}</span>
                                                        <CheckCircle2 className="w-3 h-3 text-amber-400 fill-amber-400/20" />
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                                                        <span>ባህር ዳር / Bahir Dar</span>
                                                        <span>•</span>
                                                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> ክፍት ነው
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-[9px] font-bold text-neutral-300 flex items-center gap-1">
                                                <Wifi className="w-2.5 h-2.5 text-amber-400" />
                                                <span>Free WiFi</span>
                                            </div>
                                        </div>

                                        {/* Interactive Fasting Switch Toggle */}
                                        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 mb-3">
                                            <div
                                                className="flex items-center gap-2 cursor-pointer select-none"
                                                onClick={() => setFastingOnly(!fastingOnly)}
                                            >
                                                <span className="text-sm">🌿</span>
                                                <span className="text-xs font-bold text-white">
                                                    {previewLang === 'AM' ? 'የጾም ብቻ' : 'Fasting Only (የጾም)'}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={fastingOnly}
                                                onClick={() => setFastingOnly(!fastingOnly)}
                                                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                    fastingOnly ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' : 'bg-neutral-600'
                                                }`}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                        fastingOnly ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Normal Dishes Listing */}
                                        <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-0.5 scrollbar-thin">
                                            {displayedDishes.map((dish) => (
                                                <div
                                                    key={dish.id}
                                                    className="p-3 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 hover:border-neutral-600 transition-all text-left"
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <h4 className="text-xs font-black text-white truncate">
                                                                    {previewLang === 'AM' ? dish.nameAm : dish.nameEn}
                                                                </h4>
                                                                {dish.isFasting && (
                                                                    <span className="text-[9px] font-bold px-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                                        ጾም
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5 leading-tight">
                                                                {previewLang === 'AM' ? dish.descAm : dish.descEn}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs font-black text-amber-400 shrink-0">
                                                            {dish.price} ETB
                                                        </span>
                                                    </div>
                                                    <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-neutral-700/40">
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">
                                                            {previewLang === 'AM' ? dish.badgeAm : dish.badgeEn}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddToCart(dish.price)}
                                                            className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 transition-all flex items-center gap-1"
                                                        >
                                                            <span>+</span>
                                                            <span>{previewLang === 'AM' ? 'ጨምር' : 'Add'}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mock Floating Tab / Order Bar */}
                                    <div className="mt-3 p-2.5 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-between shadow-lg shadow-amber-500/20">
                                        <div className="flex items-center gap-1.5 text-xs font-black">
                                            <span>🛍️</span>
                                            <span>
                                                {previewLang === 'AM'
                                                    ? `${cartCount} ምግቦች • ${cartTotal} ብር`
                                                    : `${cartCount} items • ${cartTotal} ETB`}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-slate-950 text-white flex items-center gap-1">
                                            <span>{previewLang === 'AM' ? 'ትዕዛዝ ላክ' : 'Send Order'}</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Key Features Section ─── */}
            <section id="features" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
                        {isAm ? 'ሙሉ አገልግሎቶች' : 'Built for Modern Ethiopian Hospitality'}
                    </h2>
                    <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                        {isAm ? 'የሬስቶራንትዎን ስራ የሚያቀሉ ዘመናዊ መገልገያዎች' : 'Everything You Need to Manage Your Digital Menu'}
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Feature 1: Bilingual */}
                    <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Languages className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">
                            {isAm ? 'አማርኛ እና እንግሊዝኛ (Ge\'ez Support)' : 'Native Amharic & English'}
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {isAm
                                ? 'የምግብ ዝርዝርዎን በሁለቱም ቋንቋዎች ያዘጋጁ። ደንበኞች በአንድ ንክኪ ይቀያይራሉ፤ ፍለጋውም በግዕዝ እና በእንግሊዝኛ በትክክል ይሰራል!'
                                : 'Dual language out-of-the-box. Diners toggle between English and Amharic with one tap, with phonetic Ge\'ez search.'}
                        </p>
                    </div>

                    {/* Feature 2: High Speed on local telecom */}
                    <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Zap className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">
                            {isAm ? 'ከ1 ሰከንድ ያነሰ ፍጥነት' : 'Sub-Second Loading on 3G/4G'}
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {isAm
                                ? 'የሞባይል ኢንተርኔት ደካማ በሆነበት ሰዓት እንኳን ሜኑው በፍጥነት ይከፈታል፤ በስልኩ ውስጥ ስለሚቀመጥ ዳታ አያባክንም!'
                                : 'Progressive Web App caching ensures the menu loads in milliseconds on Ethio Telecom and Safaricom networks.'}
                        </p>
                    </div>

                    {/* Feature 3: Fasting Filter */}
                    <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Utensils className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">
                            {isAm ? 'የ1-ንክኪ የጾም ምግብ ማጣሪያ' : '1-Tap Fasting (የጾም) Filter'}
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {isAm
                                ? 'በጾም ወቅት ደንበኞች በ1 ንክኪ የጾም ምግቦችን ብቻ ለይተው እንዲያዩ የሚያስችል ልዩ የማጣሪያ አዝራር።'
                                : 'Dedicated top-level filter chip allows diners to isolate fasting dishes immediately during Abiy Tsom, Wednesdays, and Fridays.'}
                        </p>
                    </div>

                    {/* Feature 4: WhatsApp Orders */}
                    <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <PhoneCall className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">
                            {isAm ? 'የጠረጴዛ ትዕዛዝ እና ዋትስአፕ' : 'Table Tab & WhatsApp Dispatch'}
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {isAm
                                ? 'ደንበኞች ያዘዙትን ከነጠረጴዛ ቁጥራቸው በቀጥታ በዋትስአፕ ወይም በስክሪናቸው ለአስተናጋጅ በማሳየት በፍጥነት ያዛሉ።'
                                : 'Diners build their order at the table and send pre-formatted order summaries to your waiter or bar WhatsApp.'}
                        </p>
                    </div>

                    {/* Feature 5: Print Studio */}
                    <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Printer className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">
                            {isAm ? 'ለህትመት የተዘጋጁ QR ካርዶች' : 'Print Studio & Table Stands'}
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {isAm
                                ? 'በA4 ሉህ ላይ የተዘጋጁ ባለ ከፍተኛ ጥራት የጠረጴዛ QR ካርዶችን ከሬስቶራንትዎ ሎጎ ጋር በአንድ ክሊክ አትመው ይውሰዱ።'
                                : 'Generate ready-to-print multi-table sheets, table tents, and SVG vectors with your restaurant logo directly in dashboard.'}
                        </p>
                    </div>

                    {/* Feature 6: Phone Photo Upload */}
                    <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Camera className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">
                            {isAm ? 'በስልክ ካሜራ ፎቶ መጫኛ' : 'Direct Phone Camera Photo Sync'}
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {isAm
                                ? 'በስልክዎ ካሜራ የምግብ ፎቶ በማንሳት በቅጽበት ወደ ኮምፒውተርዎ ዳሽቦርድ የሚልክ የQR ኮድ ማገናኛ ቴክኖሎጂ።'
                                : 'Snap hot dishes directly with your smartphone and sync them instantly to your desktop dashboard with zero file transfer.'}
                        </p>
                    </div>
                </div>
            </section>

            {/* ─── Pricing Section (Updated: 2999/yr or 9999 one-time) ─── */}
            <section id="pricing" className="py-20 sm:py-28 bg-slate-900/40 border-t border-slate-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
                            <span>{isAm ? 'ግልጽ እና ተመጣጣኝ ዋጋ' : 'Simple, Transparent Pricing'}</span>
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                            {isAm ? 'አንድ ሙሉ ፓኬጅ • ሁለት የምርጫ መንገዶች' : 'One Complete Package • Two Simple Ways to Pay'}
                        </h2>
                        <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
                            {isAm
                                ? 'ምንም የተደበቀ ክፍያ የለም! ዓመታዊ በ2,999 ብር ይክፈሉ ወይም በ9,999 ብር የአንድ ጊዜ ክፍያ ለዘለቄታው የእርስዎ ያድርጉት።'
                                : 'All features included in both options. No hidden transaction fees, no item limits. Pay annually or buy lifetime access.'}
                        </p>

                        {/* Billing Switcher Tabs */}
                        <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
                            <button
                                type="button"
                                onClick={() => setPricingBilling('ANNUAL')}
                                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                                    pricingBilling === 'ANNUAL'
                                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {isAm ? 'ዓመታዊ ክፍያ (2,999 ብር)' : 'Annual Plan (2,999 ETB/yr)'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPricingBilling('LIFETIME')}
                                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                                    pricingBilling === 'LIFETIME'
                                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <InfinityIcon className="w-4 h-4" />
                                <span>{isAm ? 'የአንድ ጊዜ ክፍያ (9,999 ብር)' : 'One-Time Lifetime (9,999 ETB)'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Pricing Cards Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
                        {/* Plan 1: Annual Subscription */}
                        <div
                            className={`p-8 rounded-3xl bg-slate-900 border transition-all flex flex-col justify-between ${
                                pricingBilling === 'ANNUAL'
                                    ? 'border-2 border-amber-500 shadow-2xl shadow-amber-500/15 relative'
                                    : 'border-slate-800'
                            }`}
                        >
                            {pricingBilling === 'ANNUAL' && (
                                <div className="absolute -top-3.5 left-8 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                                    {isAm ? 'ዝቅተኛ የመነሻ ወጪ' : 'Lowest Entry Cost'}
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xl font-black text-white">
                                        {isAm ? 'ዓመታዊ እቅድ (Annual)' : 'Annual Subscription'}
                                    </h4>
                                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                                        <Calendar className="w-5 h-5" />
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mb-6">
                                    {isAm
                                        ? 'በወር 250 ብር ብቻ! አነስተኛ ወጪ ለሚመርጡ ካፌዎችና ሬስቶራንቶች'
                                        : 'Only ~250 ETB/month. Perfect for new and growing venues.'}
                                </p>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                                            2,999
                                        </span>
                                        <span className="text-sm font-bold text-amber-400">ETB</span>
                                        <span className="text-xs font-semibold text-slate-400">
                                            / {isAm ? 'በዓመት' : 'per year'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 block mt-1">
                                        {isAm ? 'የ14 ቀን ነጻ ሙከራን ያካትታል' : 'Includes 14-day risk-free trial'}
                                    </span>
                                </div>

                                <ul className="space-y-3 text-xs font-semibold text-slate-300">
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'ያልተገደበ የምግብና መጠጥ ዝርዝር' : 'Unlimited Menu Items & Categories'}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'ሙሉ አማርኛ (ግዕዝ) እና እንግሊዝኛ ድጋፍ' : 'Full Bilingual English & Ge\'ez Amharic'}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'ለህትመት የተዘጋጁ የጠረጴዛ QR ካርዶች (A4 Sheets)' : 'High-Res Print Studio (A4 Table Cards)'}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'ዋጋዎችን በቅጽበት በስልክ የመቀየር እድል' : 'Instant 2-Second Price & Availability Updates'}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'የጾም ምግብ ማጣሪያ (Fasting Filter)' : '1-Tap Fasting (የጾም) Seasonal Filter'}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'የዋትስአፕ የጠረጴዛ ማዘዣ (WhatsApp Order)' : 'Table Tab & WhatsApp Order Dispatch'}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'የስልክ ካሜራ ፎቶ ማመሳሰያ (Photo Sync)' : 'Phone Camera Photo Sync to Dashboard'}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'ቴሌብርና የባንክ ክፍያ ድጋፍ' : 'Telebirr, CBE Birr & Local Bank Support'}</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-800">
                                <Link
                                    to="/register"
                                    className={`w-full py-3.5 rounded-xl font-black text-xs text-center transition-all block ${
                                        pricingBilling === 'ANNUAL'
                                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95'
                                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                                    }`}
                                >
                                    {isAm ? 'የ14 ቀን ነጻ ሙከራ ጀምር' : 'Start 14-Day Free Trial'}
                                </Link>
                                <span className="text-[11px] text-slate-500 text-center block mt-2">
                                    {isAm ? 'ምንም ክፍያ ሳያስፈልግ በነጻ ይሞክሩት' : 'Test free first • No card required'}
                                </span>
                            </div>
                        </div>

                        {/* Plan 2: Lifetime One-Time Payment */}
                        <div
                            className={`p-8 rounded-3xl bg-slate-900 border transition-all flex flex-col justify-between ${
                                pricingBilling === 'LIFETIME'
                                    ? 'border-2 border-amber-500 shadow-2xl shadow-amber-500/20 relative'
                                    : 'border-slate-800'
                            }`}
                        >
                            <div className="absolute -top-3.5 right-8 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                                {isAm ? 'የኢትዮጵያ ሬስቶራንቶች ተመራጭ' : 'Most Popular in Ethiopia'}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xl font-black text-white">
                                        {isAm ? 'የአንድ ጊዜ ክፍያ (Lifetime)' : 'One-Time Lifetime'}
                                    </h4>
                                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                                        <InfinityIcon className="w-5 h-5" />
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mb-6">
                                    {isAm
                                        ? 'አንድ ጊዜ ብቻ ይክፈሉ! ምንም ዓይነት ወርሃዊ ወይም ዓመታዊ የእድሳት ክፍያ የለም'
                                        : 'Pay once, own forever. Zero monthly fees, zero renewals, forever yours.'}
                                </p>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                                            9,999
                                        </span>
                                        <span className="text-sm font-bold text-amber-400">ETB</span>
                                        <span className="text-xs font-semibold text-slate-400">
                                            / {isAm ? 'የአንድ ጊዜ ክፍያ' : 'one-time'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-emerald-400 font-bold block mt-1">
                                        {isAm ? '★ ለዘለቄታው የሚቆይ ፈቃድ (Lifetime Access)' : '★ Lifetime hosting & free future updates included'}
                                    </span>
                                </div>

                                <ul className="space-y-3 text-xs font-semibold text-slate-300">
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'ሁሉንም የOurMenu አገልግሎቶች ለዘለቄታው ያገኛሉ' : 'All Features from the Annual Plan Included'}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'ምንም አይነት ወርሃዊ ወይም ዓመታዊ የእድሳት ክፍያ የለም' : 'Zero Recurring Bills or Hidden Renewal Fees'}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'ያልተገደበ የምግብና የመጠጥ ካታሎግ' : 'Unlimited Dishes, Photos & Categories'}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'የQR ህትመት ፋይሎች ለህይወት ዘመን የሚሰሩ' : 'Permanent Dynamic QR Codes (Never Expire)'}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'ለወደፊት የሚጨመሩ አዳዲስ ቴክኖሎጂዎች በነጻ' : 'All Future Platform Updates Included Free'}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'ቀጥተኛ የስልክና የዋትስአፕ የደንበኞች ድጋፍ' : 'Priority WhatsApp & Direct Phone Support'}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                                        <span>{isAm ? 'በቴሌብር ወይም በባንክ በቅጽበት ማስተካከል' : 'Instant Activation via Telebirr or CBE'}</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-800">
                                <Link
                                    to="/register"
                                    className={`w-full py-3.5 rounded-xl font-black text-xs text-center transition-all block ${
                                        pricingBilling === 'LIFETIME'
                                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95'
                                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                                    }`}
                                >
                                    {isAm ? 'የአንድ ጊዜ ክፍያ እቅድን ይምረጡ' : 'Get Lifetime License (9,999 ETB)'}
                                </Link>
                                <span className="text-[11px] text-slate-500 text-center block mt-2">
                                    {isAm ? 'አንድ ጊዜ ከፍለው በሰላም ይጠቀሙ' : 'Pay once • Use forever'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Ethiopian Payment Methods Banner */}
                    <div className="mt-12 max-w-4xl mx-auto p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <h4 className="text-sm font-bold text-white">
                                {isAm ? 'ክፍያዎን በአገር ውስጥ የክፍያ መንገዶች በቀላሉ ይፈጽሙ' : 'Flexible Ethiopian Payment Methods Accepted'}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {isAm
                                    ? 'ቴሌብር (Telebirr)፣ የኢትዮጵያ ንግድ ባንክ (CBE Birr)፣ አዋሽ ባንክ ወይም አቢሲንያ'
                                    : 'Telebirr, Commercial Bank of Ethiopia (CBE), Awash Bank, Bank of Abyssinia, or Cash on Activation.'}
                            </p>
                        </div>
                        <a
                            href="https://wa.me/251911223344"
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0"
                        >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>{isAm ? 'የክፍያ ድጋፍ / አግኙን' : 'Payment Assistance'}</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* ─── Frequently Asked Questions ─── */}
            <section id="faq" className="py-20 sm:py-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{isAm ? 'የተለመዱ ጥያቄዎች' : 'Got Questions?'}</span>
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                        {isAm ? 'በተደጋጋሚ የሚጠየቁ ጥያቄዎች እና መልሶቻቸው' : 'Frequently Asked Questions'}
                    </h3>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => {
                        const isOpen = openFaqIndex === idx;
                        return (
                            <div
                                key={idx}
                                className="rounded-2xl bg-slate-900/70 border border-slate-800/80 overflow-hidden transition-all"
                            >
                                <button
                                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-amber-400 transition-colors"
                                >
                                    <span>{isAm ? faq.qAm : faq.qEn}</span>
                                    {isOpen ? (
                                        <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                    )}
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/50 pt-3">
                                        {isAm ? faq.aAm : faq.aEn}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ─── Final CTA Banner ─── */}
            <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800 relative overflow-hidden text-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                        {isAm
                            ? 'ሬስቶራንትዎን ዛሬውኑ ወደ ዘመናዊ የQR ዲጂታል ሜኑ ይቀይሩ'
                            : 'Ready to Transform Your Restaurant in 5 Minutes?'}
                    </h3>
                    <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                        {isAm
                            ? 'በ14 ቀናት ነጻ ሙከራ ይጀምሩ። ምንም አይነት ቅድመ ክፍያ ወይም ክሬዲት ካርድ አያስፈልግዎትም።'
                            : 'Join Ethiopia\'s forward-thinking cafes and restaurants. Start your 14-day free trial right now.'}
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/register"
                            className="px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <span>{isAm ? 'አሁኑኑ በነጻ ይጀምሩ' : 'Start Free Trial Now'}</span>
                            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </Link>
                        <a
                            href="https://wa.me/251911223344"
                            target="_blank"
                            rel="noreferrer"
                            className="px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm transition-all flex items-center gap-2"
                        >
                            <Share2 className="w-4 h-4 text-amber-400" />
                            <span>{isAm ? 'በዋትስአፕ ያግኙን' : 'Chat with Us on WhatsApp'}</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="py-12 bg-slate-950 border-t border-slate-900 text-xs text-slate-400">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-slate-950 font-black text-xs shadow">
                            OM
                        </div>
                        <div>
                            <span className="font-extrabold text-white text-sm">OurMenu Ethiopia</span>
                            <p className="text-[11px] text-slate-500">
                                © {new Date().getFullYear()} OurMenu. All rights reserved.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <a
                            href="https://wa.me/251911223344"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                        >
                            <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                            <span>+251 911 22 33 44 (WhatsApp / Direct)</span>
                        </a>
                        <Link to="/login" className="hover:text-white transition-colors">
                            {isAm ? 'የባለቤት ዳሽቦርድ' : 'Owner Dashboard'}
                        </Link>
                        <Link to="/register" className="hover:text-white transition-colors">
                            {isAm ? 'ይመዝገቡ' : 'Sign Up'}
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
