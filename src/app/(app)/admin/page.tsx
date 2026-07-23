"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { todayISO, toISODate, subDays, fromISODate } from "@/lib/dates";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";

const ADMIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ADMIN === "true";

interface StatRow {
  entry_date: string;
  active_users: number;
  fajr_count: number;
  dhuhr_count: number;
  asr_count: number;
  maghrib_count: number;
  isha_count: number;
  reading_count: number;
  sport_count: number;
  silence_count: number;
}

export default function AdminPage() {
  const { t, locale } = useTranslation();
  const [status, setStatus] = useState<
    "loading" | "not_admin" | "ready" | "error"
  >("loading");
  const [rows, setRows] = useState<StatRow[]>([]);

  useEffect(() => {
    if (!ADMIN_ENABLED) return;
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.is_admin) {
          if (active) setStatus("not_admin");
          return;
        }

        const { data, error } = await supabase.rpc("admin_group_daily_stats", {
          from_date: toISODate(subDays(new Date(), 30)),
          to_date: todayISO(),
        });
        if (error) throw error;
        if (active) {
          setRows((data as StatRow[]) ?? []);
          setStatus("ready");
        }
      } catch {
        if (active) setStatus("error");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!ADMIN_ENABLED) {
    return (
      <Card>
        <CardTitle>{t("admin.title")}</CardTitle>
        <p className="mt-3 text-sm text-content-muted">{t("admin.disabled")}</p>
      </Card>
    );
  }

  const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  const headers = [
    t("admin.date"),
    t("admin.activeUsers"),
    t("options.fajr"),
    t("options.dhuhr"),
    t("options.asr"),
    t("options.maghrib"),
    t("options.isha"),
    t("activities.personal_reading"),
    t("activities.sport"),
    t("activities.silence"),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-content">
          {t("admin.title")}
        </h1>
        <p className="text-sm text-content-muted">{t("admin.subtitle")}</p>
      </div>

      <Card>
        <CardSubtitle>{t("admin.anonNote")}</CardSubtitle>

        {status === "loading" && (
          <p className="mt-3 text-sm text-content-muted">{t("common.loading")}</p>
        )}
        {status === "not_admin" && (
          <p className="mt-3 text-sm text-content-muted">{t("admin.notAdmin")}</p>
        )}
        {status === "error" && (
          <p className="mt-3 text-sm text-danger">{t("common.error")}</p>
        )}
        {status === "ready" && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-start text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-content-muted">
                  {headers.map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-2 text-start">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.entry_date} className="border-b border-border">
                    <td className="whitespace-nowrap px-2 py-2 text-content">
                      {fmt.format(fromISODate(r.entry_date))}
                    </td>
                    <td className="px-2 py-2">{r.active_users}</td>
                    <td className="px-2 py-2">{r.fajr_count}</td>
                    <td className="px-2 py-2">{r.dhuhr_count}</td>
                    <td className="px-2 py-2">{r.asr_count}</td>
                    <td className="px-2 py-2">{r.maghrib_count}</td>
                    <td className="px-2 py-2">{r.isha_count}</td>
                    <td className="px-2 py-2">{r.reading_count}</td>
                    <td className="px-2 py-2">{r.sport_count}</td>
                    <td className="px-2 py-2">{r.silence_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
