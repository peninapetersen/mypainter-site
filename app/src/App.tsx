import { Route, Routes } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBannerProvider } from "@/context/ErrorBannerContext";
import { LoginPage } from "@/pages/LoginPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";

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
          <Route index element={<PlaceholderPage title="Home" subtitle="Welcome back, Richo." />} />
          <Route path="pipeline" element={<PlaceholderPage title="Pipeline" />} />
          <Route path="clients" element={<PlaceholderPage title="Clients" />} />
          <Route path="requests" element={<PlaceholderPage title="Requests" />} />
          <Route path="quotes" element={<PlaceholderPage title="Quotes" />} />
          <Route path="jobs" element={<PlaceholderPage title="Jobs" />} />
          <Route path="invoices" element={<PlaceholderPage title="Invoices" />} />
          <Route path="expenses" element={<PlaceholderPage title="Expenses" />} />
          <Route path="schedule" element={<PlaceholderPage title="Schedule" />} />
          <Route path="timesheets" element={<PlaceholderPage title="Timesheets" />} />
          <Route path="marketing" element={<PlaceholderPage title="Marketing" />} />
          <Route path="insights" element={<PlaceholderPage title="Insights" />} />
          <Route path="insights/reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="insights/tax" element={<PlaceholderPage title="Tax Returns" />} />
        </Route>
      </Routes>
    </ErrorBannerProvider>
  );
}
