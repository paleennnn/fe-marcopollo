"use client";

import React from "react";
import { useList, useApiUrl } from "@refinedev/core";
import { Spin } from "antd";
import MaterialList from "@/components/customer/materials/list";

export default function CustomerMaterialsPage() {
  const apiUrl = useApiUrl();

  // Ambil data dari endpoint public
  const { data, isLoading } = useList({
    resource: "public/materials",
    pagination: { pageSize: 12 },
  });

  const materials = data?.data ?? [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🧱 Daftar Material</h1>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : (
        <MaterialList items={materials} apiUrl={apiUrl} />
      )}
    </div>
  );
}
