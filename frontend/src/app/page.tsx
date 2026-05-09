import Link from 'next/link';
import {
  BookOpen, Users, Award, TrendingUp, Play, CheckCircle,
  Zap, Shield, Globe, ArrowRight, Star, BarChart2, MessageSquare,
} from 'lucide-react';

// SSG — all content is static; built once at build time and served from CDN
export const dynamic = 'force-static';

const stats = [
  { label: 'Courses', value: '500+', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Students', value: '50,000+', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Certificates', value: '12,000+', icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Instructors', value: '200+', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
];

const features = [
  {
    icon: Globe,
    title: 'Multi-tenant Organizations',
    desc: 'Each organization gets its own branded space with custom courses and members.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: Play,
    title: 'Rich Course Builder',
    desc: 'Video lessons, quizzes, assignments, and live sessions — all in one platform.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: BarChart2,
    title: 'Progress Tracking',
    desc: 'Real-time lesson progress, quiz scores, and enrollment analytics dashboards.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Zap,
    title: 'Payments & Coupons',
    desc: 'Integrated Stripe checkout with discount coupons and flexible pricing.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    icon: Award,
    title: 'Verified Certificates',
    desc: 'Auto-issue certificates on course completion with public verification.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: MessageSquare,
    title: 'Discussion Forums',
    desc: 'Course-level boards with threaded replies, upvotes, and instructor answers.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
];

const steps = [
  { step: '01', title: 'Create your organization', desc: 'Set up your branded academy in minutes.' },
  { step: '02', title: 'Build your courses', desc: 'Add lessons, quizzes, and assignments with ease.' },
  { step: '03', title: 'Invite learners', desc: 'Enroll students and start tracking their progress.' },
];

const testimonials = [
  {
    name: 'Sarah K.',
    role: 'Head of L&D, TechCorp',
    text: 'EduCore transformed how we onboard employees. Our completion rates jumped 40%.',
    stars: 5,
  },
  {
    name: 'James O.',
    role: 'Independent Instructor',
    text: 'I launched my first paid course in a day. The platform just works.',
    stars: 5,
  },
  {
    name: 'Priya M.',
    role: 'University Programme Lead',
    text: 'The multi-tenant system lets each department manage their own content seamlessly.',
    stars: 5,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-extrabold text-primary-700 tracking-tight">
            Edu<span className="text-indigo-400">Core</span>
          </span>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/courses" className="hover:text-primary-600 transition">Courses</Link>
            <Link href="/organizations" className="hover:text-primary-600 transition">Organizations</Link>
            <Link href="/auth/login" className="hover:text-primary-600 transition">Sign In</Link>
          </nav>
          <Link
            href="/auth/register"
            className="bg-primary-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary-700 transition shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-500 text-white">
        {/* decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 py-28 text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <Zap className="w-3.5 h-3.5" /> Now with AI-powered analytics
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            The LMS Built for<br />
            <span className="text-indigo-200">Modern Teams</span>
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            EduCore gives organizations, instructors, and learners a single
            powerful platform — from course creation to certified completion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition shadow-lg shadow-black/10"
            >
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition"
            >
              <Play className="w-4 h-4 fill-white" /> Browse Courses
            </Link>
          </div>
          <p className="mt-6 text-indigo-200 text-sm">
            No credit card required · Free forever plan
          </p>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="bg-gray-50 border-y border-gray-100 py-5 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-gray-400 font-medium">
          {['TechCorp', 'BrightAcademy', 'SkillHub', 'LearnPath', 'EduFirst'].map((name) => (
            <span key={name} className="tracking-wide uppercase text-xs">{name}</span>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition"
            >
              <div className={`p-3 rounded-xl ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <span className="text-3xl font-extrabold text-gray-900">{value}</span>
              <span className="text-gray-500 text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
              Everything you need to teach &amp; learn
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              A complete platform that scales from solo instructors to enterprise academies.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-5`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">How it works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Up and running in minutes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="flex flex-col items-start gap-4 p-7 rounded-2xl bg-gradient-to-br from-primary-50 to-indigo-50 border border-primary-100">
                <span className="text-4xl font-black text-primary-200">{s.step}</span>
                <h3 className="font-semibold text-gray-900 text-base">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Loved by educators worldwide</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHECKLIST SECTION ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest">Why EduCore</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-6">
              Built for performance, security, and scale
            </h2>
            <ul className="space-y-4">
              {[
                'Role-based access: Admin, Instructor, Student',
                'JWT + refresh token authentication',
                'Real-time notifications and progress sync',
                'Stripe-powered payments with webhooks',
                'Docker-ready with Postgres & NestJS',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-700 text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-sm bg-gradient-to-br from-primary-600 to-indigo-500 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200">
              <Shield className="w-8 h-8 mb-4 text-indigo-200" />
              <p className="text-2xl font-bold mb-2">Enterprise-ready</p>
              <p className="text-indigo-100 text-sm mb-6">
                Secure, scalable infrastructure trusted by organizations of all sizes.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-indigo-50 transition"
              >
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ── */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary-700 to-indigo-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-4">Ready to build your academy?</h2>
          <p className="text-indigo-200 mb-10 text-lg">
            Join thousands of organizations using EduCore to educate, engage, and grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-semibold px-10 py-3.5 rounded-xl hover:bg-indigo-50 transition shadow-lg shadow-black/10"
            >
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-10 py-3.5 rounded-xl hover:bg-white/10 transition"
            >
              View Courses
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <span className="text-white font-bold text-lg">
            Edu<span className="text-indigo-400">Core</span>
          </span>
          <nav className="flex gap-6">
            <Link href="/courses" className="hover:text-white transition">Courses</Link>
            <Link href="/auth/login" className="hover:text-white transition">Sign In</Link>
            <Link href="/auth/register" className="hover:text-white transition">Register</Link>
          </nav>
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} EduCore. All rights reserved.</p>
        </div>
      </footer>

    </main>
  );
}
