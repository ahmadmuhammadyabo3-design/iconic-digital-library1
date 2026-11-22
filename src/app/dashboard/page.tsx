import React from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata = {
  title: "Dashboard | ICONIC Digital Library",
  description: "Academic dashboard and repository circulation statistics",
};

export default function DashboardPage() {
  return <DashboardView />;
}
