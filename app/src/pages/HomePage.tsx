import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCurrency } from "@/lib/nz";
import { listClients } from "@/lib/clients";
import { listRequests } from "@/lib/requests";
import { listQuotes } from "@/lib/quotes";
import { listJobs } from "@/lib/jobs";
import { listInvoices } from "@/lib/invoices";

export function HomePage() {
  const [stats, setStats] = useState({ clients: 0, requests: 0, quotes: 0, jobs: 0, invoices: 0, outstanding: 0 });

  useEffect(() => {
    Promise.all([listClients(), listRequests(), listQuotes(), listJobs(), listInvoices()])
      .then(([clients, requests, quotes, jobs, invoices]) => {
        const outstanding = invoices
          .filter((i) => i.status !== "paid")
          .reduce((sum, i) => sum + Number(i.balance), 0);
        setStats({
          clients: clients.length,
          requests: requests.filter((r) => r.status === "open").length,
          quotes: quotes.filter((q) => q.status === "sent").length,
          jobs: jobs.filter((j) => j.status === "active").length,
          invoices: invoices.filter((i) => i.status === "sent" || i.status === "overdue").length,
          outstanding,
        });
      })
      .catch(() => {});
  }, []);

  const cards = [
    { label: "Clients", value: stats.clients, to: "/clients/list" },
    { label: "Open requests", value: stats.requests, to: "/requests/list" },
    { label: "Quotes out", value: stats.quotes, to: "/quotes/list" },
    { label: "Active jobs", value: stats.jobs, to: "/jobs/list" },
    { label: "Unpaid invoices", value: stats.invoices, to: "/invoices/list" },
  ];

  return (
    <div>
      <PageHeader title="Home" subtitle="Welcome back, Richo." />
      <div className="mb-6 rounded-xl bg-[var(--mp-navy)] p-6 text-white">
        <p className="text-sm text-white/70">Outstanding balance</p>
        <p className="text-3xl font-bold">{formatCurrency(stats.outstanding)}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[var(--mp-orange)]">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/clients" className="rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white">
          + New client
        </Link>
        <Link to="/requests" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">
          + New request
        </Link>
        <Link to="/quotes" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">
          + New quote
        </Link>
      </div>
    </div>
  );
}
