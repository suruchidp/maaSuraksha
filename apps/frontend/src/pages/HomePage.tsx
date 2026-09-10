import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Heart,
  Shield,
  Brain,
  Activity,
} from "lucide-react";

export default function HomePage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Activity,
      title: t("dashboard.pregnancy"),
      description: "Track your pregnancy journey week by week",
    },
    {
      icon: Heart,
      title: t("dashboard.healthMetrics"),
      description: "Monitor vital health indicators",
    },
    {
      icon: Brain,
      title: t("dashboard.assessments"),
      description: "AI-powered risk assessments",
    },
    {
      icon: Shield,
      title: t("dashboard.alerts"),
      description: "Timely alerts for health concerns",
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-primary-50 via-white to-accent-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            {t("app.name")}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t("app.tagline")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-3">
              {t("nav.register")}
            </Link>
            <Link to="/login" className="btn-secondary text-lg px-8 py-3">
              {t("nav.login")}
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-amber-700 text-sm">
              {t("footer.disclaimer")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
