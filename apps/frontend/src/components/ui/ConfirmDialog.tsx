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
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-gray-600">{message}</p>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel ?? t("common.confirm")}
        </Button>
      </div>
    </Modal>
  );
}