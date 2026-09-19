import { CreateStartPage } from "@/components/ui/CreateStartPage";
import { useListCount } from "@/hooks/useListCount";
import { listInvoices } from "@/lib/invoices";

export function InvoicesStartPage() {
  const count = useListCount(listInvoices);

  return (
    <CreateStartPage
      heading="Create an invoice"
      description="Bill a completed job or create an invoice from scratch. Track what's sent, paid, and still outstanding."
      viewAllLabel="View all invoices"
      viewAllTo="/invoices/list"
      viewAllCount={count}
      cards={[
        { title: "Use a Template", to: "#", variant: "template", disabled: true },
        { title: "Create an Invoice", to: "/invoices/new", variant: "create" },
      ]}
    />
  );
}
