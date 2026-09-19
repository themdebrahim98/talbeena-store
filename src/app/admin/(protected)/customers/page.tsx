import { getAdminCustomers } from "@/queries/admin";

export const metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

export default async function AdminCustomersPage() {
  const customers = await getAdminCustomers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Registered Customers</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Directory of store customers and registered accounts ({customers.length}).
        </p>
      </div>

      {/* Mobile Card View (< md) */}
      <div className="space-y-3 md:hidden">
        {customers.map((c) => {
          const dateStr = c.createdAt
            ? new Date(c.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—";
          const initials = (c.fullName || "User")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={c.uid}
              className="rounded-2xl border bg-card p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">
                      {c.fullName || "Customer"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      {c.uid}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    c.role === "admin"
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.role}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Phone</span>
                  {c.phone ? (
                    <a href={`tel:${c.phone}`} className="font-medium text-primary hover:underline">
                      {c.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Joined</span>
                  <span className="text-foreground">{dateStr}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <span className="text-muted-foreground">Account Status</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    c.isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {c.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          );
        })}
        {customers.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground border rounded-2xl bg-card">
            No registered customers found.
          </div>
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block rounded-3xl border bg-card overflow-hidden shadow-xs">
        {customers.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((c) => {
                const dateStr = c.createdAt
                  ? new Date(c.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";

                return (
                  <tr key={c.uid} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-foreground">
                        {c.fullName || "Customer"}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {c.uid}
                      </p>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {c.phone || "—"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          c.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.role}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{dateStr}</td>
                    <td className="p-4">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-10 text-center text-xs text-muted-foreground">
            No registered customers found.
          </div>
        )}
      </div>
    </div>
  );
}
