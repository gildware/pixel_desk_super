"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  listHelpdeskTickets,
  replyHelpdeskTicket,
  updateHelpdeskTicketStatus,
} from "@/src/services/api/helpdeskTickets.api";
import type {
  HelpdeskAttachment,
  HelpdeskTicketRow,
  HelpdeskTicketStatus,
} from "@/src/types/helpdeskTickets.types";

type StatusFilter = "all" | HelpdeskTicketStatus;

const textareaClass =
  "w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-theme-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90";
const primaryBtn =
  "rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50";

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusBadgeClass(status: HelpdeskTicketStatus): string {
  switch (status) {
    case "open":
      return "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400";
    case "hold":
      return "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400";
    case "closed":
    default:
      return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
  }
}

function AttachmentLinks({ items }: { items?: HelpdeskAttachment[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((file, i) => (
        <a
          key={`${file.url}-${i}`}
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-theme-xs text-brand-600 hover:underline dark:border-gray-700 dark:bg-gray-900 dark:text-brand-400"
        >
          📎 {file.filename}
        </a>
      ))}
    </div>
  );
}

function initials(name: string | null, email: string | null): string {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function HelpdeskPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<HelpdeskTicketRow[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    listHelpdeskTickets()
      .then((rows) => {
        setTickets(rows);
        setSelectedId((prev) => prev ?? (rows[0]?.id ?? null));
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleTickets = useMemo(
    () =>
      filter === "all"
        ? tickets
        : tickets.filter((t) => t.status === filter),
    [tickets, filter],
  );

  const selected = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId],
  );

  const openCount = useMemo(
    () => tickets.filter((t) => t.status === "open").length,
    [tickets],
  );

  const handleReply = async () => {
    if (!selected) return;
    const message = replyText.trim();
    if (!message) {
      setError("Reply message is required.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const updated = await replyHelpdeskTicket(selected.id, message);
      setTickets((p) => p.map((t) => (t.id === updated.id ? updated : t)));
      setReplyText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleChangeStatus = async (next: HelpdeskTicketStatus) => {
    if (!selected || next === selected.status) return;
    setStatusBusy(true);
    try {
      const updated = await updateHelpdeskTicketStatus(selected.id, next);
      setTickets((p) => p.map((t) => (t.id === updated.id ? updated : t)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Helpdesk
        </h3>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          {openCount} open
        </span>
      </div>
      <p className="mb-5 text-theme-sm text-gray-500 dark:text-gray-400">
        Messages users send from the dashboard Helpdesk. Open a request to see
        the sender, their company, and reply by email.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        {/* List */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-1 border-b border-gray-200 p-2 dark:border-gray-800">
            {(["all", "open", "hold", "closed"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-theme-xs font-medium capitalize ${
                  filter === f
                    ? "bg-brand-500 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="max-h-[calc(100vh_-_320px)] min-h-[240px] overflow-y-auto">
            {loading ? (
              <p className="p-4 text-theme-sm text-gray-500 dark:text-gray-400">
                Loading…
              </p>
            ) : visibleTickets.length === 0 ? (
              <p className="p-4 text-theme-sm text-gray-500 dark:text-gray-400">
                No requests here.
              </p>
            ) : (
              visibleTickets.map((t, idx) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(t.id);
                    setReplyText("");
                    setError(null);
                  }}
                  className={`flex w-full items-start gap-3 p-3 text-left ${
                    idx > 0
                      ? "border-t border-gray-200 dark:border-gray-800"
                      : ""
                  } ${
                    selectedId === t.id
                      ? "bg-brand-50 dark:bg-brand-500/10"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-theme-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                    {initials(t.userName, t.userEmail)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-theme-sm font-medium text-gray-900 dark:text-white">
                        {t.userName || t.userEmail || "Unknown user"}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusBadgeClass(
                          t.status,
                        )}`}
                      >
                        {t.status}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-theme-sm text-gray-700 dark:text-gray-300">
                      {t.subject}
                    </span>
                    <span className="mt-0.5 block truncate text-theme-xs text-gray-400 dark:text-gray-500">
                      {t.companyName || "No company"} · {formatDate(t.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800 lg:p-5">
          {!selected ? (
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              Select a request to view its details.
            </p>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    {selected.subject}
                  </h4>
                  <p className="mt-0.5 text-theme-xs text-gray-400 dark:text-gray-500">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                  Status
                  <select
                    value={selected.status}
                    disabled={statusBusy}
                    onChange={(e) =>
                      handleChangeStatus(
                        e.target.value as HelpdeskTicketStatus,
                      )
                    }
                    className="rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 text-theme-sm font-medium capitalize text-gray-800 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
                  >
                    <option value="open">Open</option>
                    <option value="hold">Hold</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
              </div>

              {/* Sender details */}
              <dl className="mt-4 grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-theme-sm dark:border-gray-800 dark:bg-white/[0.02] sm:grid-cols-2">
                <div>
                  <dt className="text-theme-xs text-gray-400 dark:text-gray-500">
                    From
                  </dt>
                  <dd className="text-gray-900 dark:text-white">
                    {selected.userName || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-theme-xs text-gray-400 dark:text-gray-500">
                    Email
                  </dt>
                  <dd className="break-all text-gray-900 dark:text-white">
                    {selected.userEmail ? (
                      <a
                        href={`mailto:${selected.userEmail}`}
                        className="text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {selected.userEmail}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-theme-xs text-gray-400 dark:text-gray-500">
                    Company
                  </dt>
                  <dd className="text-gray-900 dark:text-white">
                    {selected.companyName || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-theme-xs text-gray-400 dark:text-gray-500">
                    Company ID
                  </dt>
                  <dd className="break-all text-gray-900 dark:text-white">
                    {selected.companyId || "—"}
                  </dd>
                </div>
              </dl>

              {/* Original message */}
              <div className="mt-4">
                <p className="mb-1 text-theme-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Message
                </p>
                <div className="whitespace-pre-wrap rounded-lg border border-gray-100 bg-white p-3 text-theme-sm text-gray-800 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-200">
                  {selected.message}
                </div>
                <AttachmentLinks items={selected.attachments} />
              </div>

              {/* Reply thread */}
              {selected.replies.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-theme-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Replies
                  </p>
                  {selected.replies.map((r, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-brand-100 bg-brand-50 p-3 dark:border-brand-500/20 dark:bg-brand-500/10"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-theme-xs font-medium text-brand-700 dark:text-brand-300">
                          {r.byName}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          {formatDate(r.at)}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap text-theme-sm text-gray-800 dark:text-gray-200">
                        {r.message}
                      </div>
                      <AttachmentLinks items={r.attachments} />
                    </div>
                  ))}
                </div>
              )}

              {/* Reply box */}
              <div className="mt-5">
                <label className="mb-1 block text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Reply to {selected.userEmail || "the sender"}
                </label>
                <textarea
                  className={textareaClass}
                  rows={4}
                  value={replyText}
                  placeholder={
                    selected.userEmail
                      ? "Write your reply… it will be emailed to the sender."
                      : "This sender has no email on file, so a reply cannot be emailed."
                  }
                  disabled={!selected.userEmail}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    className={primaryBtn}
                    disabled={sending || !replyText.trim() || !selected.userEmail}
                    onClick={handleReply}
                  >
                    {sending ? "Sending…" : "Send reply"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
