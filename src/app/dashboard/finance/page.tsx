"use client";

import { useGetIdentity } from "@refinedev/core";
import { redirect } from "next/navigation";
import { FinanceDashboard } from "@components/finance/finance-dashboard";
import { Spin } from "antd";

export default function FinancePage() {
  const { data: identity, isLoading } = useGetIdentity<any>();

  if (isLoading) {
    return <Spin fullscreen />;
  }

  // Redirect jika bukan admin
  if (identity?.role !== "admin") {
    redirect("/");
  }

  return <FinanceDashboard />;
}