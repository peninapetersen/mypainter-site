import { CreateStartPage } from "@/components/ui/CreateStartPage";

export function ClientsStartPage() {
  return (
    <CreateStartPage
      heading="Create a client"
      description="Add a new client with contact details, property addresses, and notes. Or open your full client list to find someone you've worked with before."
      viewAllLabel="View all clients"
      viewAllTo="/clients/list"
      cards={[
        { title: "Use a Template", to: "#", variant: "template", disabled: true },
        { title: "Create a Client", to: "/clients/new", variant: "create" },
      ]}
    />
  );
}
