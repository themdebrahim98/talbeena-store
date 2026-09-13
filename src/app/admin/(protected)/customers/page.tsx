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
        <h1 className="text-2xl font-bold tracking-tight">Registered Customers</h1>
        <p className="text-sm text-muted-foreground">
          Directory of store customers and registered accounts.
        </p>
      </div>

      <div className="rounded-3xl border bg-card overflow-hidden shadow-xs">
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
