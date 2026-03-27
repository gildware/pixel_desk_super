"use client";

import React, { useMemo, useState } from "react";
import {
  getCompanyDefaultRolePermissions,
  listCompanyDefaultRoles,
  updateCompanyDefaultRolePermissions,
} from "@/src/services/api/companyDefaultRoles.api";
import type {
  CompanyDefaultRole,
  PermissionAction,
  PermissionGroup,
} from "@/src/types/companyDefaultRoles.types";

function normalizeActionLabel(actionName: string) {
  // Backend uses casl-style action names (create/read/update/delete/self-manage)
  if (actionName === "self-manage") return "Self Manage";
  if (actionName === "self_manage") return "Self Manage";
  return actionName
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CompanyDefaultRolesTab() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<CompanyDefaultRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<
    PermissionGroup[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await listCompanyDefaultRoles();
        if (cancelled) return;
        setRoles(r);
        const first = r[0]?.id ?? null;
        setSelectedRoleId(first);
        if (first != null) {
          const p = await getCompanyDefaultRolePermissions(first);
          if (cancelled) return;
          setDraftPermissions(p.permissions);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load roles");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const actionHeaders = useMemo(() => {
    const actions = draftPermissions?.[0]?.actions ?? [];
    return actions.map((a) => a.name);
  }, [draftPermissions]);

  const handleSelectRole = async (roleId: number) => {
    try {
      setError(null);
      setLoading(true);
      setSelectedRoleId(roleId);
      const p = await getCompanyDefaultRolePermissions(roleId);
      setDraftPermissions(p.permissions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load role permissions");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (subject: string, actionName: string) => {
    setDraftPermissions((prev) => {
      if (!prev) return prev;
      return prev.map((group) => {
        if (group.subject !== subject) return group;
        return {
          ...group,
          actions: group.actions.map((a) => {
            if (a.name !== actionName) return a;
            return { ...a, hasPermission: !a.hasPermission } satisfies PermissionAction;
          }),
        };
      });
    });
  };

  const handleSave = async () => {
    if (!selectedRoleId || !draftPermissions) return;
    try {
      setSaving(true);
      setError(null);
      await updateCompanyDefaultRolePermissions({
        id: selectedRoleId,
        permissions: draftPermissions,
      });

      // Reload to ensure backend truth.
      const latest = await getCompanyDefaultRolePermissions(selectedRoleId);
      setDraftPermissions(latest.permissions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !roles.length) {
    return (
      <p className="text-theme-sm text-gray-500 dark:text-gray-400">Loading…</p>
    );
  }

  return (
    <div className="w-full max-w-6xl">
      <div className="mb-4">
        <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
          Company default roles
        </h3>
        <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
          These are global system roles. Editing permissions here applies to all
          companies. Company-level role editing is disabled for these defaults.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {roles.map((r) => {
          const active = r.id === selectedRoleId;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelectRole(r.id)}
              className={`rounded-lg px-3 py-1.5 text-theme-sm font-medium transition-colors ${
                active
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              }`}
            >
              {r.name}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-theme-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-400">
          {error}
        </div>
      )}

      {draftPermissions && (
        <>
          <div className="mb-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !selectedRoleId}
              className="rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Update permissions"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-left text-theme-xs text-gray-800 dark:text-white/90">
              <thead className="bg-gray-50 text-theme-xs uppercase dark:bg-white/[0.04]">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  {actionHeaders.map((a) => (
                    <th key={a} className="px-3 py-2">
                      {normalizeActionLabel(a)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {draftPermissions.map((group) => (
                  <tr
                    key={group.subject}
                    className="border-t border-gray-200 dark:border-gray-800"
                  >
                    <td className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                      {group.subject.replaceAll("_", " ")}
                    </td>
                    {group.actions.map((action) => (
                      <td key={action.name} className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={action.hasPermission}
                          onChange={() =>
                            togglePermission(group.subject, action.name)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

