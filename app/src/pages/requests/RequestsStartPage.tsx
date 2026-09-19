import { CreateStartPage } from "@/components/ui/CreateStartPage";
import { useListCount } from "@/hooks/useListCount";
import { listRequests } from "@/lib/requests";

export function RequestsStartPage() {
  const count = useListCount(listRequests);

  return (
    <CreateStartPage
      heading="Create a request"
      description="Capture a new job enquiry with service details, photos, and line items. Or review open requests waiting for a quote."
      viewAllLabel="View all requests"
      viewAllTo="/requests/list"
      viewAllCount={count}
      cards={[
        { title: "Use a Template", to: "#", variant: "template", disabled: true },
        { title: "Create a Request", to: "/requests/new", variant: "create" },
      ]}
    />
  );
}
