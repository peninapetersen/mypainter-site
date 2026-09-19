import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  Clock,
  FileText,
  Globe,
  HardHat,
  Home,
  Kanban,
  Megaphone,
  Package,
  Receipt,
  ScrollText,
  Settings,
  UserCircle,
  Wallet,
  Wrench,
} from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  children?: { label: string; path: string }[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/", icon: Home },
  { label: "Pipeline", path: "/pipeline", icon: Kanban },
  {
    label: "Contacts",
    path: "/clients",
    icon: UserCircle,
    children: [
      { label: "Customers", path: "/clients/list" },
      { label: "Suppliers", path: "/suppliers/list" },
      { label: "Contractors", path: "/contractors/list" },
    ],
  },
  { label: "Requests", path: "/requests/list", icon: ScrollText },
  { label: "Leads", path: "/leads/list", icon: Wrench },
  { label: "Quotes", path: "/quotes/list", icon: FileText },
  { label: "Jobs On", path: "/jobs-on/list", icon: HardHat },
  { label: "Invoices", path: "/invoices/list", icon: Receipt },
  { label: "Products & services", path: "/services/list", icon: Package },
  { label: "Expenses", path: "/expenses/list", icon: Wallet },
  { label: "Website", path: "/website", icon: Globe },
  { label: "Settings", path: "/settings/work", icon: Settings },
  { label: "Schedule", path: "/schedule", icon: Calendar },
  { label: "Timesheets", path: "/timesheets", icon: Clock },
  { label: "Marketing", path: "/marketing", icon: Megaphone },
  {
    label: "Insights",
    path: "/insights",
    icon: BarChart3,
    children: [
      { label: "Reports", path: "/insights/reports" },
      { label: "Tax Returns", path: "/insights/tax" },
    ],
  },
];

export const NEW_MENU_LINKS = [
  { label: "Customer", path: "/clients/new" },
  { label: "Supplier", path: "/suppliers/new" },
  { label: "Contractor", path: "/contractors/new" },
  { label: "Request", path: "/requests" },
  { label: "Lead", path: "/leads" },
  { label: "Product / service", path: "/services/new" },
  { label: "Quote", path: "/quotes/new" },
  { label: "Invoice", path: "/invoices/new" },
  { label: "Expense", path: "/expenses/new" },
];
