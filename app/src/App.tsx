import { Outlet, Route, Routes } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBannerProvider } from "@/context/ErrorBannerContext";
import { LoginPage } from "@/pages/LoginPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { HomePage } from "@/pages/HomePage";
import { ClientsStartPage } from "@/pages/clients/ClientsStartPage";
import { ClientsListPage } from "@/pages/clients/ClientsListPage";
import { ClientFormPage } from "@/pages/clients/ClientFormPage";
import { RequestsStartPage } from "@/pages/requests/RequestsStartPage";
import { RequestsListPage } from "@/pages/requests/RequestsListPage";
import { RequestFormPage } from "@/pages/requests/RequestFormPage";
import { QuotesStartPage } from "@/pages/quotes/QuotesStartPage";
import { QuotesListPage } from "@/pages/quotes/QuotesListPage";
import { QuoteFormPage } from "@/pages/quotes/QuoteFormPage";
import { JobsStartPage } from "@/pages/jobs/JobsStartPage";
import { JobsListPage } from "@/pages/jobs/JobsListPage";
import { JobFormPage } from "@/pages/jobs/JobFormPage";
import { InvoicesStartPage } from "@/pages/invoices/InvoicesStartPage";
import { InvoicesListPage } from "@/pages/invoices/InvoicesListPage";
import { InvoiceFormPage } from "@/pages/invoices/InvoiceFormPage";
import { ExpensesStartPage } from "@/pages/expenses/ExpensesStartPage";
import { ExpensesListPage } from "@/pages/expenses/ExpensesListPage";
import { ExpenseFormPage } from "@/pages/expenses/ExpenseFormPage";

export default function App() {
  return (
    <ErrorBannerProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="pipeline" element={<PlaceholderPage title="Pipeline" subtitle="Kanban board — Phase 4." />} />

          <Route path="clients" element={<Outlet />}>
            <Route index element={<ClientsStartPage />} />
            <Route path="list" element={<ClientsListPage />} />
            <Route path="new" element={<ClientFormPage />} />
            <Route path=":id" element={<ClientFormPage />} />
          </Route>

          <Route path="requests" element={<Outlet />}>
            <Route index element={<RequestsStartPage />} />
            <Route path="list" element={<RequestsListPage />} />
            <Route path="new" element={<RequestFormPage />} />
            <Route path=":id" element={<RequestFormPage />} />
          </Route>

          <Route path="quotes" element={<Outlet />}>
            <Route index element={<QuotesStartPage />} />
            <Route path="list" element={<QuotesListPage />} />
            <Route path="new" element={<QuoteFormPage />} />
            <Route path=":id" element={<QuoteFormPage />} />
          </Route>

          <Route path="jobs" element={<Outlet />}>
            <Route index element={<JobsStartPage />} />
            <Route path="list" element={<JobsListPage />} />
            <Route path="new" element={<JobFormPage />} />
            <Route path=":id" element={<JobFormPage />} />
          </Route>

          <Route path="invoices" element={<Outlet />}>
            <Route index element={<InvoicesStartPage />} />
            <Route path="list" element={<InvoicesListPage />} />
            <Route path="new" element={<InvoiceFormPage />} />
            <Route path=":id" element={<InvoiceFormPage />} />
          </Route>

          <Route path="expenses" element={<Outlet />}>
            <Route index element={<ExpensesStartPage />} />
            <Route path="list" element={<ExpensesListPage />} />
            <Route path="new" element={<ExpenseFormPage />} />
            <Route path=":id" element={<ExpenseFormPage />} />
          </Route>
          <Route path="schedule" element={<PlaceholderPage title="Schedule" subtitle="Phase 4 — calendar." />} />
          <Route path="timesheets" element={<PlaceholderPage title="Timesheets" subtitle="Phase 4 — crew check-in/out." />} />
          <Route path="marketing" element={<PlaceholderPage title="Marketing" subtitle="Phase 5 — marketing hub." />} />
          <Route path="insights" element={<PlaceholderPage title="Insights" subtitle="Phase 5 — dashboards." />} />
          <Route path="insights/reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="insights/tax" element={<PlaceholderPage title="Tax Returns" />} />
        </Route>
      </Routes>
    </ErrorBannerProvider>
  );
}
