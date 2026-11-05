"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isSiteAdmin } from "@/app/admin/upload/actions";
import { DeleteVideoButton } from "@/app/admin/upload/delete-video-button";

const AdminContext = createContext(false);

/**
 * Asks once, after load, whether the viewer is a site admin. The page itself
 * stays static and cached for everyone; only admins see the extra controls.
 */
export function ExploreAdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    let cancelled = false;
    isSiteAdmin().then((yes) => !cancelled && setAdmin(yes));
    return () => {
      cancelled = true;
    };
  }, []);
  return <AdminContext.Provider value={admin}>{children}</AdminContext.Provider>;
}

/** Delete (database row and R2 file) for site admins; nothing for everyone else. */
export function AdminDeleteVideo({ videoId, title }: { videoId: number; title: string }) {
  if (!useContext(AdminContext)) return null;
  return (
    <div className="mt-2 self-end">
      <DeleteVideoButton videoId={videoId} title={title} />
    </div>
  );
}
