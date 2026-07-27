"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { todayISO, toISODate, subDays, fromISODate } from "@/lib/dates";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

const ADMIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ADMIN === "true";

/** Plages proposées : trois choix suffisent, au-delà on ajoute de la charge. */
const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

/** Statistique agrégée et anonymisée : uniquement date + membres actifs. */
interface GroupStat {
  entry_date: string;
  active_users: number;
}

type Status = "loading" | "not_admin" | "ready" | "error";

export default function AdminPage() {
  const { t, locale } = useTranslation();
  const [status, setStatus] = useState<Status>("loading");
  const [rows, setRows] = useState<GroupStat[]>([]);
  const [range, setRange] = useState<Range>(30);

  const load = useCallback(async (days: Range) => {
    setStatus("loading");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("not_admin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.is_admin) {
        setStatus("not_admin");
        return;
      }

      const { data, error } = await supabase.rpc("admin_group_daily_stats", {
        from_date: toISODate(subDays(new Date(), days - 1)),
        to_date: todayISO(),
      });
      if (error) throw error;

      setRows((data as GroupStat[]) ?? []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!ADMIN_ENABLED) return;
    void load(range);
  }, [load, range]);

  const summary = useMemo(() => {
    if (rows.length === 0) return { peak: 0, average: 0, days: 0 };
    const counts = rows.map((r) => r.active_users);
    const total = counts.reduce((sum, n) => sum + n, 0);
    return {
      peak: Math.max(...counts),
      average: Math.round(total / counts.length),
      days: rows.length,
    };
  }, [rows]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    [locale],
  );

  if (!ADMIN_ENABLED) {
    return (
      <Card>
        <CardTitle>{t("admin.title")}</CardTitle>
        <p className="mt-3 text-sm text-content-muted">{t("admin.disabled")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-content">{t("admin.title")}</h1>
        <p className="text-sm text-content-muted">{t("admin.subtitle")}</p>
      </header>

      {/* Filtre de période */}
      <div
        role="group"
        aria-label={t("admin.rangeLabel")}
        className="flex flex-wrap gap-2"
      >
        {RANGES.map((days) => (
          <button
            key={days}
            type="button"
            aria-pressed={range === days}
            onClick={() => setRange(days)}
            className={cn(
              "min-h-[40px] rounded-full border px-4 text-sm transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              range === days
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-surface text-content-muted hover:bg-surface-2",
            )}
          >
            {t("admin.rangeDays", { count: days })}
          </button>
        ))}
      </div>

      {status === "not_admin" && (
        <Card>
          <EmptyState
            icon="target"
            title={t("admin.notAdmin")}
            description={t("admin.notAdminHelp")}
          />
        </Card>
      )}

      {status === "error" && (
        <Card>
          <Alert tone="danger">{t("common.error")}</Alert>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => load(range)}>
              {t("common.retry")}
            </Button>
          </div>
        </Card>
      )}

      {status === "loading" && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="mt-3 h-7 w-1/2" />
              </Card>
            ))}
          </div>
          <SkeletonCard lines={6} />
        </>
      )}

      {status === "ready" && (
        <>
          {/* Effet de contraste : les chiffres clés d'abord, ils donnent
              l'échelle qui rend le détail quotidien lisible ensuite. */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile label={t("admin.peak")} value={summary.peak} />
            <StatTile label={t("admin.average")} value={summary.average} />
            <StatTile label={t("admin.daysTracked")} value={summary.days} />
          </div>

          <Card>
            <CardTitle>{t("admin.dailyTitle")}</CardTitle>
            <CardSubtitle>{t("admin.anonNote")}</CardSubtitle>

            {rows.length === 0 ? (
              <EmptyState
                icon="clock"
                title={t("admin.emptyTitle")}
                description={t("admin.emptyDescription")}
              />
            ) : (
              /* Liste plutôt que tableau large : lisible sans défilement
                 horizontal, et la barre rend les jours comparables d'un coup. */
              <>
                <div className="mt-4 flex items-center gap-4 border-b border-border pb-2 text-xs font-medium uppercase tracking-wide text-content-muted">
                  <span className="w-28 flex-none">{t("admin.date")}</span>
                  <span className="flex-1" />
                  <span className="w-24 flex-none text-end normal-case">
                    {t("admin.activeUsers")}
                  </span>
                </div>
                <ul className="divide-y divide-border">
                {rows.map((row) => {
                  const ratio =
                    summary.peak > 0 ? (row.active_users / summary.peak) * 100 : 0;
                  return (
                    <li
                      key={row.entry_date}
                      className="flex items-center gap-4 py-3"
                    >
                      <span className="w-28 flex-none text-sm text-content">
                        {dateFormatter.format(fromISODate(row.entry_date))}
                      </span>

                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${ratio}%` }}
                        />
                      </span>

                      <span className="w-24 flex-none text-end text-sm font-semibold tabular-nums text-content">
                        {row.active_users}
                      </span>
                    </li>
                  );
                })}
                </ul>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-content-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-content">
        {value}
      </p>
    </Card>
  );
}
