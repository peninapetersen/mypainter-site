import { Route, Routes } from "react-router-dom";
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

          <Route path="clients" element={<ClientsStartPage />} />
          <Route path="clients/list" element={<ClientsListPage />} />
          <Route path="clients/new" element={<ClientFormPage />} />
          <Route path="clients/:id" element={<ClientFormPage />} />

          <Route path="requests" element={<RequestsStartPage />} />
          <Route path="requests/list" element={<RequestsListPage />} />
          <Route path="requests/new" element={<RequestFormPage />} />
          <Route path="requests/:id" element={<RequestFormPage />} />

          <Route path="quotes" element={<QuotesStartPage />} />
          <Route path="quotes/list" element={<QuotesListPage />} />
          <Route path="quotes/new" element={<QuoteFormPage />} />
          <Route path="quotes/:id" element={<QuoteFormPage />} />

          <Route path="jobs" element={<JobsStartPage />} />
          <Route path="jobs/list" element={<JobsListPage />} />
          <Route path="jobs/new" element={<JobFormPage />} />
          <Route path="jobs/:id" element={<JobFormPage />} />

          <Route path="invoices" element={<InvoicesStartPage />} />
          <Route path="invoices/list" element={<InvoicesListPage />} />
          <Route path="invoices/new" element={<InvoiceFormPage />} />
          <Route path="invoices/:id" element={<InvoiceFormPage />} />

          <Route path="expenses" element={<PlaceholderPage title="Expenses" subtitle="Phase 3 — receipts and GST boards." />} />
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
