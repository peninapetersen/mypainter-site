import { CreateStartPage } from "@/components/ui/CreateStartPage";
import { useListCount } from "@/hooks/useListCount";
import { listClients } from "@/lib/clients";

export function ClientsStartPage() {
  const count = useListCount(listClients);

  return (
    <CreateStartPage
      heading="Create a customer"
      description="Add a customer with contact details, property addresses, and notes. Or open your full customer list to find someone you've worked with before."
      viewAllLabel="View all customers"
      viewAllTo="/clients/list"
      viewAllCount={count}
      cards={[
        { title: "Use a Template", to: "#", variant: "template", disabled: true },
        { title: "Create a Client", to: "/clients/new", variant: "create" },
      ]}
    />
  );
}
