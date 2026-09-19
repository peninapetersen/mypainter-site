import { CreateStartPage } from "@/components/ui/CreateStartPage";
import { useListCount } from "@/hooks/useListCount";
import { listQuotes } from "@/lib/quotes";

export function QuotesStartPage() {
  const count = useListCount(listQuotes);

  return (
    <CreateStartPage
      heading="Create a quote"
      description="Start by using a template tailored to your industry, or by importing any of your existing quote data. Alternatively you can create a quote manually."
      viewAllLabel="View all quotes"
      viewAllTo="/quotes/list"
      viewAllCount={count}
      cards={[
        { title: "Use a Template", to: "#", variant: "template", disabled: true },
        { title: "Create a Quote", to: "/quotes/new", variant: "create" },
      ]}
      importLabel="Import Quote Data"
      importHint="Import from CSV or your old quotes — coming in a later phase."
    />
  );
}
