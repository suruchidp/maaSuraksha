import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Heart, Shield, Brain, Activity } from "lucide-react";
import { MaternalHero } from "@/components/illustrations/MaternalHero";
import { BotanicalSprig } from "@/components/illustrations/Botanical";

export default function HomePage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Activity,
      title: t("home.featurePregnancy"),
      description: t("home.featurePregnancyDesc"),
      tile: "bg-primary-100/90 text-primary-700",
      ring: "hover:border-primary-200",
    },
    {
      icon: Heart,
      title: t("home.featureMetrics"),
      description: t("home.featureMetricsDesc"),
      tile: "bg-accent-100/90 text-accent-700",
      ring: "hover:border-accent-200",
    },
    {
      icon: Brain,
      title: t("home.featureAssessments"),
      description: t("home.featureAssessmentsDesc"),
      tile: "bg-lavender-100/90 text-lavender-700",
      ring: "hover:border-lavender-200",
    },
    {
      icon: Shield,
      title: t("home.featureAlerts"),
      description: t("home.featureAlertsDesc"),
      tile: "bg-peach-100/90 text-peach-700",
      ring: "hover:border-peach-200",
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-maternal-hero">
        <section className="bg-gradient-to-br from-primary-50/40 via-cream-50/40 to-accent-50/40 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-center">
              <div className="text-center lg:text-left">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700 shadow-sm">
                  <Heart className="w-4 h-4" />
                  {t("app.tagline")}
                </p>
                <h1 className="mt-6 font-display text-4xl md:text-6xl font-semibold text-gray-900 text-balance">
                  {t("app.name")}
                </h1>
                <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
                  {t("app.tagline")}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link to="/register" className="btn-primary text-lg px-8 py-3 rounded-xl">
                    {t("nav.register")}
                  </Link>
                  <Link to="/login" className="btn-secondary text-lg px-8 py-3 rounded-xl">
                    {t("nav.login")}
                  </Link>
                </div>
              </div>

              <div className="hidden lg:block w-80 mx-auto drop-shadow-xl">
                <MaternalHero id="home-hero" />
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold font-display text-center text-gray-900 mb-12">
            {t("home.features")}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`card hover:shadow-soft hover:-translate-y-1 transition-all duration-200 p-6 ${feature.ring}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${feature.tile}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1.5">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-cream-50/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative bg-white/90 border border-rose-100/70 rounded-3xl p-8 shadow-card">
            <BotanicalSprig className="absolute -top-3 -right-3 w-20 opacity-60" tone="sage" />
            <p className="text-amber-700 text-sm leading-relaxed">{t("footer.disclaimer")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}