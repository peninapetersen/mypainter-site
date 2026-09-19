import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  Clock,
  FileText,
  Home,
  Kanban,
  Megaphone,
  Receipt,
  ScrollText,
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
  { label: "Clients", path: "/clients", icon: UserCircle },
  { label: "Requests", path: "/requests", icon: ScrollText },
  { label: "Quotes", path: "/quotes", icon: FileText },
  { label: "Jobs", path: "/jobs", icon: Wrench },
  { label: "Invoices", path: "/invoices", icon: Receipt },
  { label: "Expenses", path: "/expenses", icon: Wallet },
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
  { label: "Client", path: "/clients" },
  { label: "Request", path: "/requests" },
  { label: "Quote", path: "/quotes" },
  { label: "Job", path: "/jobs" },
  { label: "Invoice", path: "/invoices" },
  { label: "Expense", path: "/expenses/new" },
];
