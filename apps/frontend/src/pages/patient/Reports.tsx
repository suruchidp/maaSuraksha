import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { reportSchema, healthRecordSchema } from "@maasuraksha/shared";
import { useAuthStore } from "@/stores/authStore";
import { useReports, useCreateReport } from "@/hooks/queries";
import { getReport } from "@/services/reports";
import {
  listHealthRecords,
  createHealthRecord,
  updateHealthRecord,
  type HealthRecordDTO,
} from "@/services/healthRecords";
import { getApiErrorMessage } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
const reportTypes = [
  "comprehensive",
  "pregnancy_summary",
  "health_metrics",
  "risk_assessment",
  "gdm_assessment",
  "ppd_assessment",
] as const;
const categories = [
  "lab_result",
  "ultrasound",
  "prescription",
  "discharge",
  "visit",
  "other",
] as const;
const inputClass = "w-full border border-gray-300 rounded-lg p-2 bg-white";
export default function ReportsPage({ patientId }: { patientId?: string }) {
  const { t } = useTranslation();
  const label = (key: string) =>
    t(`records.${key}`, { defaultValue: key.replace(/_/g, " ") });
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [recordPage, setRecordPage] = useState(1);
  const [archived, setArchived] = useState(false);
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<string>();
  const [editing, setEditing] = useState<HealthRecordDTO | null | undefined>();
  const [error, setError] = useState("");
  const reports = useReports(20, patientId, page);
  const create = useCreateReport();
  const detail = useQuery({
    queryKey: ["report-detail", user?.id, selected],
    queryFn: () => getReport(selected!),
    enabled: !!selected && !!user,
  });
  const records = useQuery({
    queryKey: [
      "health-records",
      user?.id,
      patientId,
      archived,
      category,
      recordPage,
    ],
    queryFn: () =>
      listHealthRecords({
        userId: patientId,
        archived: String(archived),
        category: category || undefined,
        page: recordPage,
        limit: 20,
      }),
    enabled: !!user,
  });
  const save = useMutation({
    mutationFn: (input: ReturnType<typeof healthRecordSchema.parse>) =>
      editing
        ? updateHealthRecord(editing.id, {
            ...input,
            updatedAt: editing.updatedAt,
          })
        : createHealthRecord(input, patientId),
    onSuccess: () => {
      setEditing(undefined);
      void qc.invalidateQueries({ queryKey: ["health-records"] });
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });
  const archive = useMutation({
    mutationFn: (r: HealthRecordDTO) =>
      updateHealthRecord(r.id, {
        isArchived: !r.isArchived,
        updatedAt: r.updatedAt,
      }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["health-records"] }),
    onError: (e) => setError(getApiErrorMessage(e)),
  });
  async function generate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const parsed = reportSchema.safeParse({
      type: f.get("type"),
      title: f.get("title") || undefined,
      fromDate: f.get("fromDate") || undefined,
      toDate: f.get("toDate") || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    create.mutate(
      { input: parsed.data, userId: patientId },
      {
        onSuccess: (r) => {
          setPage(1);
          setSelected(r.id);
        },
        onError: (e) => setError(getApiErrorMessage(e)),
      },
    );
  }
  function submitRecord(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const parsed = healthRecordSchema.safeParse(Object.fromEntries(f));
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    save.mutate(parsed.data);
  }
  function download() {
    if (!detail.data) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(detail.data, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `health-report-${detail.data.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const field = (
    name: string,
    type = "text",
    value?: string,
    required = false,
  ) => (
    <label className="block text-sm">
      {label(name === "title" ? "record_title" : name)}
      <input
        className={inputClass}
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        maxLength={type === "text" ? 200 : undefined}
      />
    </label>
  );
  const pager = (
    current: number,
    total: number | undefined,
    change: (p: number) => void,
  ) => (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        disabled={current <= 1}
        onClick={() => change(current - 1)}
      >
        {t("common.previous", { defaultValue: "Previous" })}
      </Button>
      <span>
        {current} / {Math.max(1, total ?? 1)}
      </span>
      <Button
        variant="outline"
        disabled={current >= (total ?? 1)}
        onClick={() => change(current + 1)}
      >
        {t("common.next", { defaultValue: "Next" })}
      </Button>
    </div>
  );
  return (
    <div className="space-y-6">
      <PageHeader title={label("title")} subtitle={label("subtitle")} />
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <Card>
        <h2 className="font-semibold mb-3">{label("generate_report")}</h2>
        <form onSubmit={generate} className="space-y-3">
          <label className="block text-sm">
            {label("report_type")}
            <select name="type" className={inputClass}>
              {reportTypes.map((v) => (
                <option key={v} value={v}>
                  {label(v)}
                </option>
              ))}
            </select>
          </label>
          {field("title")}
          <div className="grid sm:grid-cols-2 gap-3">
            {field("fromDate", "date")}
            {field("toDate", "date")}
          </div>
          <p className="text-sm text-gray-500">{label("snapshot_note")}</p>
          <Button type="submit" loading={create.isPending}>
            {label("generate_report")}
          </Button>
        </form>
      </Card>
      <Card>
        <h2 className="font-semibold mb-3">{label("report_history")}</h2>
        {reports.isLoading ? (
          <Spinner />
        ) : reports.isError ? (
          <ErrorState
            message={getApiErrorMessage(reports.error)}
            onRetry={() => reports.refetch()}
          />
        ) : (
          <>
            {!reports.data?.items.length && <p>{label("no_reports")}</p>}
            {reports.data?.items.map((r) => (
              <div
                key={r.id}
                className="flex justify-between gap-3 py-3 border-b"
              >
                <div>
                  <strong>{r.title}</strong>
                  <p className="text-sm text-gray-500">
                    {label(r.type)} · {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setSelected(r.id)}>
                  {label("view")}
                </Button>
              </div>
            ))}
            {pager(page, reports.data?.totalPages, setPage)}
          </>
        )}
      </Card>
      <Card>
        <div className="flex justify-between gap-3 mb-3">
          <h2 className="font-semibold">{label("health_records")}</h2>
          <Button
            onClick={() => {
              setError("");
              setEditing(null);
            }}
          >
            {label("add_record")}
          </Button>
        </div>
        <div className="flex gap-3 mb-3">
          <label>
            {label("category")}
            <select
              className={inputClass}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setRecordPage(1);
              }}
            >
              <option value="">{label("all")}</option>
              {categories.map((v) => (
                <option key={v} value={v}>
                  {label(v)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => {
                setArchived(e.target.checked);
                setRecordPage(1);
              }}
            />
            {label("archived")}
          </label>
        </div>
        {records.isLoading ? (
          <Spinner />
        ) : records.isError ? (
          <ErrorState
            message={getApiErrorMessage(records.error)}
            onRetry={() => records.refetch()}
          />
        ) : (
          <>
            {!records.data?.items.length && <p>{label("no_records")}</p>}
            {records.data?.items.map((r) => (
              <article key={r.id} className="py-4 border-b space-y-2">
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-sm text-gray-500">
                  {label(r.category)} · {r.date.slice(0, 10)} · {r.provider} ·{" "}
                  {label("author")}: {r.authorRole}
                </p>
                <p className="whitespace-pre-wrap break-words">{r.details}</p>
                {r.recordedBy === user?.id && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setError("");
                        setEditing(r);
                      }}
                    >
                      {label("edit")}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={archive.isPending}
                      onClick={() => archive.mutate(r)}
                    >
                      {label(r.isArchived ? "restore" : "archive")}
                    </Button>
                  </div>
                )}
              </article>
            ))}
            {pager(recordPage, records.data?.totalPages, setRecordPage)}
          </>
        )}
      </Card>
      <Modal
        open={editing !== undefined}
        onClose={() => {
          if (!save.isPending) setEditing(undefined);
        }}
        title={label(editing ? "edit_record" : "add_record")}
      >
        <form
          key={editing?.id ?? "new"}
          onSubmit={submitRecord}
          className="space-y-3"
        >
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
          <label className="block text-sm">
            {label("category")}
            <select
              name="category"
              defaultValue={editing?.category ?? "lab_result"}
              className={inputClass}
            >
              {categories.map((v) => (
                <option key={v} value={v}>
                  {label(v)}
                </option>
              ))}
            </select>
          </label>
          {field("title", "text", editing?.title, true)}
          {field("date", "date", editing?.date.slice(0, 10), true)}
          {field("provider", "text", editing?.provider)}
          <label className="block text-sm">
            {label("details")}
            <textarea
              name="details"
              className={inputClass}
              defaultValue={editing?.details}
              required
              maxLength={10000}
              rows={5}
            />
          </label>
          <Button type="submit" loading={save.isPending}>
            {label("save_record")}
          </Button>
        </form>
      </Modal>
      <Modal
        open={!!selected}
        onClose={() => setSelected(undefined)}
        title={detail.data?.title ?? label("report")}
        size="lg"
        footer={
          <Button disabled={!detail.data} onClick={download}>
            {label("download_json")}
          </Button>
        }
      >
        {detail.isLoading ? (
          <Spinner />
        ) : detail.isError ? (
          <ErrorState
            message={getApiErrorMessage(detail.error)}
            onRetry={() => detail.refetch()}
          />
        ) : (
          detail.data && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {label("generated_at")}:{" "}
                {new Date(detail.data.createdAt).toLocaleString()}
              </p>
              <ReportContent data={detail.data.data} label={label} />
            </>
          )
        )}
      </Modal>
    </div>
  );
}
export function ReportContent({
  data,
  label,
}: {
  data?: Record<string, unknown>;
  label: (key: string) => string;
}) {
  const sections = data?.sections as Record<string, unknown> | undefined;
  if (!sections) return <p>{label("legacy_report")}</p>;
  const range = data?.range as
    | { fromDate?: string; toDate?: string }
    | undefined;
  const patient = data?.patient as { name?: string } | undefined;
  return (
    <div className="space-y-4">
      <p>
        {patient?.name} · {range?.fromDate || label("all_dates")} —{" "}
        {range?.toDate || label("all_dates")}
      </p>
      {Object.entries(sections).map(([key, value]) => {
        const collection = value as {
          items?: Record<string, unknown>[];
          total?: number;
          included?: number;
          truncated?: boolean;
        } | null;
        const items =
          collection?.items ??
          (value ? [value as Record<string, unknown>] : []);
        return (
          <section key={key}>
            <h3 className="font-semibold border-b pb-2">{label(key)}</h3>
            {collection?.total !== undefined && (
              <p className="text-sm text-gray-500">
                {collection.included} / {collection.total} {label("entries")}
                {collection.truncated ? ` · ${label("truncated")}` : ""}
              </p>
            )}
            {!items.length && (
              <p className="text-gray-500">{label("no_data")}</p>
            )}
            {items.map((item, index) => (
              <dl
                key={index}
                className="bg-gray-50 rounded-lg p-3 my-2 grid grid-cols-2 gap-2 text-sm"
              >
                {Object.entries(item)
                  .filter(([, v]) => v !== null && v !== undefined)
                  .map(([field, v]) => (
                    <div key={field} className="col-span-2 sm:col-span-1">
                      <dt className="text-gray-500">
                        {label(field === "title" ? "record_title" : field)}
                      </dt>
                      <dd className="break-words whitespace-pre-wrap">
                        {Array.isArray(v)
                          ? v.join(", ") || "—"
                          : typeof v === "boolean"
                            ? label(v ? "yes" : "no")
                            : [
                                  "date",
                                  "createdAt",
                                  "updatedAt",
                                  "onset",
                                  "lmp",
                                  "expectedDueDate",
                                ].includes(field) &&
                                typeof v === "string" &&
                                !Number.isNaN(Date.parse(v))
                              ? new Date(v).toLocaleDateString(undefined, {
                                  timeZone: "Asia/Kolkata",
                                })
                              : [
                                    "category",
                                    "status",
                                    "severity",
                                    "frequency",
                                    "type",
                                  ].includes(field)
                                ? label(String(v))
                                : String(v)}
                      </dd>
                    </div>
                  ))}
              </dl>
            ))}
          </section>
        );
      })}
    </div>
  );
}
