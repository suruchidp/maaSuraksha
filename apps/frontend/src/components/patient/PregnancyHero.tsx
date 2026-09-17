import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, CalendarHeart } from "lucide-react";
import { MaternalHero } from "@/components/illustrations/MaternalHero";
import { BotanicalSprig } from "@/components/illustrations/Botanical";
import { TrimesterLabel } from "@/components/status/StatusLabels";

export function PregnancyHero({
  name,
  gestationalWeek,
  trimester,
  dueDate,
}: {
  name: string;
  gestationalWeek?: number;
  trimester?: number;
  dueDate?: string;
}) {
  const { t } = useTranslation();
  const hasPregnancy =
    gestationalWeek !== undefined && trimester !== undefined;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-rose-100/70 shadow-soft bg-maternal-hero">
      <BotanicalSprig className="absolute -top-3 -left-3 w-24 opacity-70" />
      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center p-6 sm:p-8">
        <div>
          <p className="text-sm font-medium text-primary-700">
            {t("patient.dashboard.heroGreeting", { name })}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-gray-900 text-balance">
            {t(
              hasPregnancy
                ? "patient.dashboard.heroSubPregnancy"
                : "patient.dashboard.heroSubNoPregnancy"
            )}
          </h1>

          {hasPregnancy ? (
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-primary-100 pl-1.5 pr-3.5 py-1 shadow-sm">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-600 text-white text-xs font-bold">
                  {gestationalWeek}
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {t("pregnancy.weeks")}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lavender-100/90 text-lavender-800 text-sm font-medium px-3 py-1">
                <TrimesterLabel trimester={trimester} />
              </span>
              {dueDate && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-peach-100/90 text-peach-800 text-sm font-medium px-3 py-1">
                  <CalendarHeart className="w-4 h-4" />
                  {t("patient.dashboard.dueDateOn", { date: dueDate })}
                </span>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <Link
                to="/patient/pregnancy"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800 rounded-xl px-1.5 py-1 -ml-1.5"
              >
                {t("patient.dashboard.setUpPregnancy")}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        <div className="hidden lg:block w-52 shrink-0 drop-shadow-lg">
          <MaternalHero id="dash-hero" />
        </div>
      </div>
    </section>
  );
}