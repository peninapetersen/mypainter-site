import { CreateStartPage } from "@/components/ui/CreateStartPage";

export function InvoicesStartPage() {
  return (
    <CreateStartPage
      heading="Create an invoice"
      description="Bill a completed job or create an invoice from scratch. Track what's sent, paid, and still outstanding."
      viewAllLabel="View all invoices"
      viewAllTo="/invoices/list"
      cards={[
        { title: "Use a Template", to: "#", variant: "template", disabled: true },
        { title: "Create an Invoice", to: "/invoices/new", variant: "create" },
      ]}
    />
  );
}
