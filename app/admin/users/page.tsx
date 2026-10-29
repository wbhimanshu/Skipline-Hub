import { Search, ShieldAlert, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { adminUsers } from "@/lib/admin";
import { PageHeader } from "@/components/ui";
import { AdminUserActions } from "@/components/admin-user-actions";
import { formatDateTime, relativeTime } from "@/lib/utils";

export const metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const users = adminUsers(query);
  const restricted = users.filter(
    (user) => user.restricted_until && new Date(user.restricted_until).getTime() > Date.now(),
  ).length;
  const unverified = users.filter((user) => !user.email_verified_at).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account moderation"
        title="Users"
        description="Verify accounts, review fairness restrictions and lift limits after appeal or expiry."
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="stat-label">Accounts</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{users.length}</p>
        </div>
        <div className="card p-4">
          <p className="stat-label">Restricted</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{restricted}</p>
        </div>
        <div className="card p-4">
          <p className="stat-label">Unverified</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{unverified}</p>
        </div>
      </div>

      <form action="/admin/users" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search name, email, organisation or role"
            className="input pl-10 text-sm"
            aria-label="Search users"
          />
        </div>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <Users className="mx-auto h-6 w-6 text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-white">No matching accounts</p>
          <p className="mt-1 text-xs text-slate-500">Try a different name or email.</p>
        </div>
      ) : (
        <div className="table-shell overflow-x-auto">
          <table className="table min-w-[960px]">
            <thead>
              <tr>
                <th>Account</th>
                <th>Role</th>
                <th>Activity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isRestricted = Boolean(
                  user.restricted_until && new Date(user.restricted_until).getTime() > Date.now(),
                );
                return (
                  <tr key={user.id}>
                    <td>
                      <p className="text-xs font-semibold text-slate-200">{user.name}</p>
                      <p className="text-[10px] text-slate-500">{user.email}</p>
                      {user.org_name ? (
                        <p className="text-[10px] text-cyan-300/70">{user.org_name}</p>
                      ) : null}
                    </td>
                    <td>
                      <span className={user.role === "org" ? "badge-cyan" : "badge-brand"}>
                        {user.role === "org" ? "Org staff" : "Customer"}
                      </span>
                    </td>
                    <td className="text-[11px] text-slate-400">
                      <p>{user.ticket_count} tokens</p>
                      <p className="text-slate-600">
                        {user.last_login_at ? `Last login ${relativeTime(user.last_login_at)}` : "Never signed in"}
                      </p>
                      <p className="text-slate-600">Joined {formatDateTime(user.created_at)}</p>
                    </td>
                    <td>
                      <div className="space-y-1">
                        {user.email_verified_at ? (
                          <span className="badge-green">Verified</span>
                        ) : (
                          <span className="badge-amber">Unverified</span>
                        )}
                        {isRestricted ? (
                          <span className="badge-rose" title={user.restriction_reason || undefined}>
                            <ShieldAlert className="h-3 w-3" />
                            Until {formatDateTime(user.restricted_until).split(",")[0]}
                          </span>
                        ) : null}
                        {user.open_appeals > 0 ? (
                          <span className="badge-cyan">{user.open_appeals} appeal pending</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <AdminUserActions
                        id={user.id}
                        name={user.name}
                        verified={Boolean(user.email_verified_at)}
                        restricted={isRestricted}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
