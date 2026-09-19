import { Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";

function LegacyJobsRedirect() {
  const params = useParams();
  const rest = params["*"];
  return <Navigate to={rest ? `/leads/${rest}` : "/leads"} replace />;
}
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
import { JobsOnStartPage } from "@/pages/jobs-on/JobsOnStartPage";
import { JobsOnListPage } from "@/pages/jobs-on/JobsOnListPage";
import { JobsOnFormPage } from "@/pages/jobs-on/JobsOnFormPage";
import { InvoicesStartPage } from "@/pages/invoices/InvoicesStartPage";
import { InvoicesListPage } from "@/pages/invoices/InvoicesListPage";
import { InvoiceFormPage } from "@/pages/invoices/InvoiceFormPage";
import { ExpensesStartPage } from "@/pages/expenses/ExpensesStartPage";
import { ExpensesListPage } from "@/pages/expenses/ExpensesListPage";
import { ExpenseFormPage } from "@/pages/expenses/ExpenseFormPage";
import { WorkSettingsPage } from "@/pages/settings/WorkSettingsPage";
import { SchedulePage } from "@/pages/schedule/SchedulePage";
import { WebsitePage } from "@/pages/website/WebsitePage";
import { PipelinePage } from "@/pages/pipeline/PipelinePage";
import { TimesheetsPage } from "@/pages/timesheets/TimesheetsPage";
import { TimesheetFormPage } from "@/pages/timesheets/TimesheetFormPage";

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
          <Route path="pipeline" element={<PipelinePage />} />

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

          <Route path="leads" element={<Outlet />}>
            <Route index element={<JobsStartPage />} />
            <Route path="list" element={<JobsListPage />} />
            <Route path="new" element={<JobFormPage />} />
            <Route path=":id" element={<JobFormPage />} />
          </Route>
          <Route path="jobs/*" element={<LegacyJobsRedirect />} />

          <Route path="jobs-on" element={<Outlet />}>
            <Route index element={<JobsOnStartPage />} />
            <Route path="list" element={<JobsOnListPage />} />
            <Route path=":id" element={<JobsOnFormPage />} />
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
          <Route path="settings">
            <Route path="work" element={<WorkSettingsPage />} />
          </Route>
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="website" element={<WebsitePage />} />
          <Route path="timesheets" element={<Outlet />}>
            <Route index element={<TimesheetsPage />} />
            <Route path="new" element={<TimesheetFormPage />} />
            <Route path=":id" element={<TimesheetFormPage />} />
          </Route>
          <Route path="marketing" element={<PlaceholderPage title="Marketing" subtitle="Phase 5 — marketing hub." />} />
          <Route path="insights" element={<PlaceholderPage title="Insights" subtitle="Phase 5 — dashboards." />} />
          <Route path="insights/reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="insights/tax" element={<PlaceholderPage title="Tax Returns" />} />
        </Route>
      </Routes>
    </ErrorBannerProvider>
  );
}
