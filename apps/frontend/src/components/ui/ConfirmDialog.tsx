import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";
import { Button } from "./Button";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  danger,
  loading = false,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-gray-600">{message}</p>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="ghost" disabled={loading} onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
          {confirmLabel ?? t("common.confirm")}
        </Button>
      </div>
    </Modal>
  );
}
