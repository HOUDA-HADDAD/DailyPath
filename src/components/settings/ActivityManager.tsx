"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { useActivities } from "@/lib/activities/provider";
import type { UserActivity } from "@/lib/activities/types";
import { activityLabel } from "@/lib/activities/labels";
import { accentFor } from "@/lib/theme/accent";
import { cn } from "@/lib/cn";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ActivityEditor } from "./ActivityEditor";

export function ActivityManager() {
  const { t } = useTranslation();
  const {
    activities,
    status,
    refresh,
    create,
    update,
    remove,
    move,
    restoreDefaults,
  } = useActivities();

  const [editing, setEditing] = useState<UserActivity | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<UserActivity | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...activities].sort((a, b) => a.sortOrder - b.sortOrder),
    [activities],
  );
  const takenKeys = useMemo(() => new Set(activities.map((a) => a.id)), [activities]);
  const enabledCount = useMemo(
    () => activities.filter((a) => a.enabled).length,
    [activities],
  );

  async function run(action: () => Promise<void>, successKey?: string) {
    setBusy(true);
    setError(null);
    try {
      await action();
      if (successKey) setFeedback(t(successKey));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return <SkeletonCard lines={5} />;

  if (status === "error") {
    return (
      <Card>
        <Alert tone="danger">{t("common.error")}</Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => refresh()}>
            {t("common.retry")}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{t("settings.activitiesTitle")}</CardTitle>
          {/* Effet de contraste : on annonce la valeur avant l'action. */}
          <CardSubtitle>
            {t("settings.activitiesSubtitle", {
              enabled: enabledCount,
              total: activities.length,
            })}
          </CardSubtitle>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          {t("settings.addActivity")}
        </Button>
      </div>

      {feedback && (
        <Alert tone="success" className="mt-4">
          {feedback}
        </Alert>
      )}
      {error && (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon="target"
          title={t("settings.emptyTitle")}
          description={t("settings.emptyDescription")}
          action={
            <Button onClick={() => setCreating(true)}>
              {t("settings.addActivity")}
            </Button>
          }
        />
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {sorted.map((activity, index) => (
            <ActivityRow
              key={activity.rowId ?? activity.id}
              activity={activity}
              isFirst={index === 0}
              isLast={index === sorted.length - 1}
              busy={busy}
              onToggle={(enabled) =>
                run(() => update({ ...activity, enabled }))
              }
              onMove={(direction) => run(() => move(activity, direction))}
              onEdit={() => setEditing(activity)}
              onDelete={() => setConfirmDelete(activity)}
            />
          ))}
        </ul>
      )}

      <div className="mt-5 border-t border-border pt-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setConfirmRestore(true)}
        >
          {t("settings.restoreDefaults")}
        </Button>
        <p className="mt-2 text-xs text-content-muted">
          {t("settings.restoreHelp")}
        </p>
      </div>

      {/* --- Création --- */}
      {creating && (
        <ActivityEditor
          open
          mode="create"
          takenKeys={takenKeys}
          nextSortOrder={activities.length}
          onClose={() => setCreating(false)}
          onSubmit={async (a) => {
            await create(a);
            setFeedback(t("settings.createdToast"));
          }}
        />
      )}

      {/* --- Édition --- */}
      {editing && (
        <ActivityEditor
          open
          mode="edit"
          activity={editing}
          takenKeys={takenKeys}
          nextSortOrder={editing.sortOrder}
          onClose={() => setEditing(null)}
          onSubmit={async (a) => {
            await update(a);
            setFeedback(t("settings.savedToast"));
          }}
        />
      )}

      {/* --- Confirmation de suppression (on explique ce qui est en jeu) --- */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={t("settings.deleteTitle")}
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              {t("settings.deleteKeep")}
            </Button>
            <Button
              className="bg-danger text-white hover:opacity-90"
              disabled={busy}
              onClick={async () => {
                const target = confirmDelete;
                setConfirmDelete(null);
                if (target) {
                  await run(() => remove(target), "settings.deletedToast");
                }
              }}
            >
              {t("settings.deleteConfirm")}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-content">
          {t("settings.deleteBody", {
            name: confirmDelete ? activityLabel(confirmDelete, t) : "",
          })}
        </p>
        <p className="mt-2 text-sm text-content-muted">
          {t("settings.deleteHistoryNote")}
        </p>
      </Modal>

      {/* --- Confirmation de restauration --- */}
      <Modal
        open={confirmRestore}
        onClose={() => setConfirmRestore(false)}
        title={t("settings.restoreTitle")}
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setConfirmRestore(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                setConfirmRestore(false);
                await run(() => restoreDefaults(), "settings.restoredToast");
              }}
            >
              {t("settings.restoreConfirm")}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-content">{t("settings.restoreBody")}</p>
      </Modal>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

function ActivityRow({
  activity,
  isFirst,
  isLast,
  busy,
  onToggle,
  onMove,
  onEdit,
  onDelete,
}: {
  activity: UserActivity;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  onToggle: (enabled: boolean) => void;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const accent = accentFor(activity.color);
  const label = activityLabel(activity, t);

  const badges: string[] = [];
  if (!activity.required) badges.push(t("common.optional"));
  if (activity.recurrence.kind === "weekly") badges.push(t("settings.recurrenceWeekly"));
  if (activity.reminderEnabled && activity.reminderTime) {
    badges.push(`${t("settings.reminderShort")} ${activity.reminderTime}`);
  }

  return (
    <li className={cn("py-3", !activity.enabled && "opacity-60")}>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 flex-none items-center justify-center rounded-xl",
            accent.badge,
          )}
        >
          <Icon name={activity.icon} className="h-[18px] w-[18px]" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-content">{label}</p>
          {badges.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-content-muted">
              {badges.join(" · ")}
            </p>
          )}
        </div>

        <Switch
          checked={activity.enabled}
          onChange={onToggle}
          label={t("settings.toggleActivity", { name: label })}
          disabled={busy}
        />
      </div>

      {/* Réorganisation par boutons : accessible au clavier et fiable au doigt,
          contrairement au glisser-déposer. */}
      <div className="mt-2 flex flex-wrap items-center gap-1 ps-12">
        <IconButton
          label={t("settings.moveUp", { name: label })}
          disabled={isFirst || busy}
          onClick={() => onMove(-1)}
        >
          ↑
        </IconButton>
        <IconButton
          label={t("settings.moveDown", { name: label })}
          disabled={isLast || busy}
          onClick={() => onMove(1)}
        >
          ↓
        </IconButton>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          {t("common.edit")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger-soft"
          onClick={onDelete}
        >
          {t("common.delete")}
        </Button>
      </div>
    </li>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border border-border text-content-muted transition-colors",
        "hover:bg-surface-2 hover:text-content",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      {children}
    </button>
  );
}
