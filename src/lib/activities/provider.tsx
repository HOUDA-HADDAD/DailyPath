"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createActivity as createActivityRow,
  deleteActivity as deleteActivityRow,
  fetchOrSeedActivities,
  persistOrder,
  restoreDefaults as restoreDefaultsRows,
  updateActivity as updateActivityRow,
} from "./store";
import type { UserActivity } from "./types";

type Status = "loading" | "ready" | "error";

interface ActivitiesContextValue {
  activities: UserActivity[];
  status: Status;
  /** Rechargement manuel (après une erreur par exemple). */
  refresh: () => Promise<void>;
  create: (activity: UserActivity) => Promise<void>;
  update: (activity: UserActivity) => Promise<void>;
  remove: (activity: UserActivity) => Promise<void>;
  /** Déplace une activité d'un cran (-1 = vers le haut, +1 = vers le bas). */
  move: (activity: UserActivity, direction: -1 | 1) => Promise<void>;
  restoreDefaults: () => Promise<void>;
}

const ActivitiesContext = createContext<ActivitiesContextValue | null>(null);

/**
 * Source unique des activités pour toute la zone connectée : le formulaire du
 * jour et les réglages partagent le même état, donc une modification dans les
 * réglages est répercutée immédiatement sur « Aujourd'hui ».
 */
export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const userIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus("loading");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("error");
        return;
      }
      userIdRef.current = user.id;
      const list = await fetchOrSeedActivities(supabase, user.id);
      setActivities(list);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(async (activity: UserActivity) => {
    const supabase = createClient();
    const userId = userIdRef.current;
    if (!userId) throw new Error("Utilisateur non authentifié");
    const created = await createActivityRow(supabase, userId, activity);
    setActivities((prev) =>
      [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder),
    );
  }, []);

  const update = useCallback(async (activity: UserActivity) => {
    const supabase = createClient();
    // Optimiste : l'UI répond instantanément, on réconcilie ensuite.
    setActivities((prev) =>
      prev.map((a) => (a.rowId === activity.rowId ? activity : a)),
    );
    const saved = await updateActivityRow(supabase, activity);
    setActivities((prev) =>
      prev
        .map((a) => (a.rowId === saved.rowId ? saved : a))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    );
  }, []);

  const remove = useCallback(async (activity: UserActivity) => {
    if (!activity.rowId) return;
    const supabase = createClient();
    const previous = activity;
    setActivities((prev) => prev.filter((a) => a.rowId !== activity.rowId));
    try {
      await deleteActivityRow(supabase, activity.rowId);
    } catch (error) {
      // Rollback si la suppression échoue côté serveur.
      setActivities((prev) =>
        [...prev, previous].sort((a, b) => a.sortOrder - b.sortOrder),
      );
      throw error;
    }
  }, []);

  const move = useCallback(
    async (activity: UserActivity, direction: -1 | 1) => {
      const supabase = createClient();
      let reordered: UserActivity[] = [];

      setActivities((prev) => {
        const sorted = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
        const index = sorted.findIndex((a) => a.rowId === activity.rowId);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= sorted.length) {
          reordered = [];
          return prev;
        }
        [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
        reordered = sorted.map((a, i) => ({ ...a, sortOrder: i }));
        return reordered;
      });

      if (reordered.length > 0) await persistOrder(supabase, reordered);
    },
    [],
  );

  const restoreDefaults = useCallback(async () => {
    const supabase = createClient();
    const userId = userIdRef.current;
    if (!userId) throw new Error("Utilisateur non authentifié");
    const list = await restoreDefaultsRows(supabase, userId);
    setActivities(list);
  }, []);

  const value = useMemo<ActivitiesContextValue>(
    () => ({
      activities,
      status,
      refresh: load,
      create,
      update,
      remove,
      move,
      restoreDefaults,
    }),
    [activities, status, load, create, update, remove, move, restoreDefaults],
  );

  return (
    <ActivitiesContext.Provider value={value}>
      {children}
    </ActivitiesContext.Provider>
  );
}

export function useActivities(): ActivitiesContextValue {
  const ctx = useContext(ActivitiesContext);
  if (!ctx) {
    throw new Error("useActivities doit être utilisé dans <ActivitiesProvider>.");
  }
  return ctx;
}
