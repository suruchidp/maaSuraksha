import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
          <SearchX className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">
          {t("access.notFoundTitle")}
        </h1>
        <p className="text-sm text-gray-500 mt-2">{t("access.notFoundMessage")}</p>
        <Link to="/">
          <Button className="mt-6">{t("nav.home")}</Button>
        </Link>
      </div>
    </div>
  );
}