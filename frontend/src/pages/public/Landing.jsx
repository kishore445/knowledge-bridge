import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Truck, CheckCircle, ArrowRight, Heart, ShoppingBag, Star } from "lucide-react";
import Layout from "../../components/Layout";
import ImpactStats from "../../components/ImpactStats";
import t from "../../i18n/en";

const STEPS = [
  { num: "01", icon: <BookOpen size={24} className="text-primary" />, text: t.landing_step1 },
  { num: "02", icon: <Star size={24} className="text-accent" />, text: t.landing_step2 },
  { num: "03", icon: <ShoppingBag size={24} className="text-primary" />, text: t.landing_step3 },
  { num: "04", icon: <CheckCircle size={24} className="text-success" />, text: t.landing_step4 },
];

export default function Landing() {
  return (
    <Layout noPad>
      {/* Hero */}
      <section className="bg-dark text-white px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-light rounded-full px-4 py-1.5 text-sm font-mono mb-6">
            <BookOpen size={14} />
            Launching in Hyderabad
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            {t.landing_hero_title}
          </h1>
          <p className="text-white/70 text-lg mb-2">{t.landing_hero_sub}</p>
          <p className="text-accent font-medium italic mb-8 text-sm">{t.tagline}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth?role=donor" className="btn-accent text-base px-6 py-3">
              <Heart size={18} />
              {t.landing_cta_donate}
            </Link>
            <Link to="/sponsor" className="btn-primary text-base px-6 py-3">
              <Star size={18} />
              {t.landing_cta_sponsor}
            </Link>
            <Link to="/browse" className="btn-outline border-white/30 text-white hover:bg-white/10 text-base px-6 py-3">
              <ShoppingBag size={18} />
              {t.landing_cta_browse}
            </Link>
          </div>
        </div>
      </section>

      {/* Impact stats */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="section-title text-center mb-6">{t.landing_impact_title}</h2>
        <ImpactStats />
      </section>

      {/* How it works */}
      <section className="bg-white border-t border-border py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title text-center text-xl mb-8">{t.landing_how_title}</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {STEPS.map((s) => (
              <div key={s.num} className="flex flex-col items-center text-center gap-3 p-4">
                <div className="bg-bg rounded-2xl w-14 h-14 flex items-center justify-center">
                  {s.icon}
                </div>
                <span className="step-num text-2xl">{s.num}</span>
                <p className="text-sm text-muted leading-snug">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three lanes */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="section-title text-center mb-8">Two ways books reach students</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card-lg border-l-4 border-success">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <CheckCircle size={20} className="text-success" />
              Donate Lane
            </h3>
            <p className="text-muted text-sm">Verified government schools order books at a low price. Sponsors can pay on their behalf — the school pays nothing.</p>
          </div>
          <div className="card-lg border-l-4 border-primary">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <ShoppingBag size={20} className="text-primary" />
              Resale Lane
            </h3>
            <p className="text-muted text-sm">Guides, exam-prep and surplus books sold at a small margin to anyone. That margin funds the platform.</p>
          </div>
        </div>
        <p className="text-xs text-center text-muted mt-4 font-mono">Government-issued books never enter the resale lane.</p>
      </section>

      {/* CTA for kabadiwalas */}
      <section className="bg-accent/10 border-t border-accent/20 py-10 px-4">
        <div className="max-w-xl mx-auto text-center">
          <Truck size={32} className="text-accent mx-auto mb-3" />
          <h2 className="font-bold text-xl mb-2">Are you a kabadiwala?</h2>
          <p className="text-muted text-sm mb-5">We pay above scrap rate for textbooks — per book, not per kg.</p>
          <Link to="/auth?role=kabadiwala" className="btn-accent inline-flex">
            Register and start selling <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
