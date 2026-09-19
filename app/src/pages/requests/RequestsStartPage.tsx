import { CreateStartPage } from "@/components/ui/CreateStartPage";

export function RequestsStartPage() {
  return (
    <CreateStartPage
      heading="Create a request"
      description="Capture a new job enquiry with service details, photos, and line items. Or review open requests waiting for a quote."
      viewAllLabel="View all requests"
      viewAllTo="/requests/list"
      cards={[
        { title: "Use a Template", to: "#", variant: "template", disabled: true },
        { title: "Create a Request", to: "/requests/new", variant: "create" },
      ]}
    />
  );
}
