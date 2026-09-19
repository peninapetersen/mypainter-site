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
import { ClientsListPage } from "@/pages/clients/ClientsListPage";
import { ClientFormPage } from "@/pages/clients/ClientFormPage";
import { RequestsListPage } from "@/pages/requests/RequestsListPage";
import { RequestFormPage } from "@/pages/requests/RequestFormPage";
import { QuotesListPage } from "@/pages/quotes/QuotesListPage";
import { QuoteFormPage } from "@/pages/quotes/QuoteFormPage";
import { JobsListPage } from "@/pages/jobs/JobsListPage";
import { JobFormPage } from "@/pages/jobs/JobFormPage";
import { JobsOnListPage } from "@/pages/jobs-on/JobsOnListPage";
import { JobsOnFormPage } from "@/pages/jobs-on/JobsOnFormPage";
import { InvoicesListPage } from "@/pages/invoices/InvoicesListPage";
import { InvoiceFormPage } from "@/pages/invoices/InvoiceFormPage";
import { InvoicePrintPage } from "@/pages/documents/InvoicePrintPage";
import { QuotePrintPage } from "@/pages/documents/QuotePrintPage";
import { ExpensesListPage } from "@/pages/expenses/ExpensesListPage";
import { ExpenseFormPage } from "@/pages/expenses/ExpenseFormPage";
import { WorkSettingsPage } from "@/pages/settings/WorkSettingsPage";
import { TaxAccountingPage } from "@/pages/settings/TaxAccountingPage";
import { ServicesListPage } from "@/pages/services/ServicesListPage";
import { ServiceFormPage } from "@/pages/services/ServiceFormPage";
import { SchedulePage } from "@/pages/schedule/SchedulePage";
import { WebsitePage } from "@/pages/website/WebsitePage";
import { PipelinePage } from "@/pages/pipeline/PipelinePage";
import { TimesheetsPage } from "@/pages/timesheets/TimesheetsPage";
import { TimesheetFormPage } from "@/pages/timesheets/TimesheetFormPage";
import { SuppliersListPage } from "@/pages/suppliers/SuppliersListPage";
import { SupplierFormPage } from "@/pages/suppliers/SupplierFormPage";
import { ContractorsListPage } from "@/pages/contractors/ContractorsListPage";
import { ContractorFormPage } from "@/pages/contractors/ContractorFormPage";

export default function App() {
  return (
    <ErrorBannerProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <AuthGuard>
              <Outlet />
            </AuthGuard>
          }
        >
          <Route path="quotes/:id/print" element={<QuotePrintPage />} />
          <Route path="invoices/:id/print" element={<InvoicePrintPage />} />
          <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="pipeline" element={<PipelinePage />} />

          <Route path="clients" element={<Outlet />}>
            <Route index element={<Navigate to="/clients/list" replace />} />
            <Route path="list" element={<ClientsListPage />} />
            <Route path="new" element={<ClientFormPage />} />
            <Route path=":id" element={<ClientFormPage />} />
          </Route>

          <Route path="suppliers" element={<Outlet />}>
            <Route index element={<Navigate to="/suppliers/list" replace />} />
            <Route path="list" element={<SuppliersListPage />} />
            <Route path="new" element={<SupplierFormPage />} />
            <Route path=":id" element={<SupplierFormPage />} />
          </Route>

          <Route path="contractors" element={<Outlet />}>
            <Route index element={<Navigate to="/contractors/list" replace />} />
            <Route path="list" element={<ContractorsListPage />} />
            <Route path="new" element={<ContractorFormPage />} />
            <Route path=":id" element={<ContractorFormPage />} />
          </Route>

          <Route path="requests" element={<Outlet />}>
            <Route index element={<Navigate to="/requests/list" replace />} />
            <Route path="list" element={<RequestsListPage />} />
            <Route path="new" element={<RequestFormPage />} />
            <Route path=":id" element={<RequestFormPage />} />
          </Route>

          <Route path="quotes" element={<Outlet />}>
            <Route index element={<Navigate to="/quotes/list" replace />} />
            <Route path="list" element={<QuotesListPage />} />
            <Route path="new" element={<QuoteFormPage />} />
            <Route path=":id" element={<QuoteFormPage />} />
          </Route>

          <Route path="leads" element={<Outlet />}>
            <Route index element={<Navigate to="/leads/list" replace />} />
            <Route path="list" element={<JobsListPage />} />
            <Route path="new" element={<JobFormPage />} />
            <Route path=":id" element={<JobFormPage />} />
          </Route>
          <Route path="jobs/*" element={<LegacyJobsRedirect />} />

          <Route path="jobs-on" element={<Outlet />}>
            <Route index element={<Navigate to="/jobs-on/list" replace />} />
            <Route path="list" element={<JobsOnListPage />} />
            <Route path=":id" element={<JobsOnFormPage />} />
          </Route>

          <Route path="invoices" element={<Outlet />}>
            <Route index element={<Navigate to="/invoices/list" replace />} />
            <Route path="list" element={<InvoicesListPage />} />
            <Route path="new" element={<InvoiceFormPage />} />
            <Route path=":id" element={<InvoiceFormPage />} />
          </Route>

          <Route path="expenses" element={<Outlet />}>
            <Route index element={<Navigate to="/expenses/list" replace />} />
            <Route path="list" element={<ExpensesListPage />} />
            <Route path="new" element={<ExpenseFormPage />} />
            <Route path=":id" element={<ExpenseFormPage />} />
          </Route>
          <Route path="services" element={<Outlet />}>
            <Route index element={<Navigate to="/services/list" replace />} />
            <Route path="list" element={<ServicesListPage />} />
            <Route path="new" element={<ServiceFormPage />} />
            <Route path=":id" element={<ServiceFormPage />} />
          </Route>

          <Route path="settings">
            <Route path="work" element={<WorkSettingsPage />} />
            <Route path="tax" element={<TaxAccountingPage />} />
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
        </Route>
      </Routes>
    </ErrorBannerProvider>
  );
}
