import { CreateStartPage } from "@/components/ui/CreateStartPage";

export function JobsStartPage() {
  return (
    <CreateStartPage
      heading="Create a job"
      description="Schedule work from an approved quote or start a job manually. Track costs, visits, and progress through to invoice."
      viewAllLabel="View all jobs"
      viewAllTo="/jobs/list"
      cards={[
        { title: "Use a Template", to: "#", variant: "template", disabled: true },
        { title: "Create a Job", to: "/jobs/new", variant: "create" },
      ]}
    />
  );
}
