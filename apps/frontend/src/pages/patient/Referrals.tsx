import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useReferrals } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { formatDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReferralStatusBadge } from "@/components/status/StatusLabels";

export default function ReferralsPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const user = useAuthStore((s) => s.user);
  const referrals = useReferrals(user?.id, 100);

  if (referrals.isLoading) return <Spinner />;

  const items = [...(referrals.data?.items ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("referrals.title")} subtitle={t("referrals.subtitle")} />

      {referrals.isError ? (
        <ErrorState message={referrals.error?.message} onRetry={() => referrals.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title={t("referrals.none")} description={t("referrals.noneDescription")} />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((ref) => (
            <Card key={ref.id}>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <ReferralStatusBadge status={ref.status} />
                <span className="text-xs text-gray-400">{formatDate(ref.createdAt, lang)}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{ref.reason}</h3>
              <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                {ref.referredToName && (
                  <p>
                    {t("referrals.referredTo")}: {ref.referredToName}
                  </p>
                )}
                {ref.facility && (
                  <p>
                    {t("referrals.facility")}: {ref.facility}
                  </p>
                )}
                {ref.notes && <p className="text-xs text-gray-500">{ref.notes}</p>}
              </div>
              {ref.history && ref.history.length > 0 && (
                <div className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-500">
                  {ref.history.map((h, i) => (
                    <p key={i}>
                      {h.status} · {t(`referrals.by`)} {h.changedBy} · {formatDate(h.changedAt, lang)}
                      {h.note ? ` — ${h.note}` : ""}
                    </p>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}