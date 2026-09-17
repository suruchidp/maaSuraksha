import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { httpGet } from "@/lib/api";

export function AlertNotificationBell({ userId }: { userId: string }) {
 const { t } = useTranslation();
 const summary = useQuery({ queryKey: ['alerts', 'summary', userId], queryFn: () => httpGet<{ unread: number; pending: number }>('/alerts/summary'), refetchInterval: 30000 });
 return <Link to="/patient/alerts" className="relative rounded-xl p-2 text-primary-700 hover:bg-primary-50" aria-label={summary.isError ? t('alerts.notificationError') : t('alerts.notificationCount', { count: summary.data?.unread ?? 0 })}>
  <Bell className="w-5 h-5" aria-hidden />
  {summary.isError ? <span className="absolute -top-1 -right-1 text-xs">!</span> : (summary.data?.unread ?? 0) > 0 && <span className="absolute -top-1 -right-1 rounded-full bg-primary-600 px-1.5 text-xs text-white">{summary.data!.unread > 99 ? '99+' : summary.data!.unread}</span>}
 </Link>;
}
