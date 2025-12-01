"use client";

import { Pie } from "@ant-design/charts";
import { Card, Typography, Space, Skeleton, Empty, Alert } from "antd";
import { PieChartOutlined } from "@ant-design/icons";
import { useApiUrl } from "@refinedev/core";
import { useEffect, useState } from "react";

const { Text } = Typography;

interface KolamStatus {
  kosong: number;
  sedang_budidaya: number;
  siap_panen: number;
}

export const PieChartStatus = () => {
  const apiUrl = useApiUrl();
  const [data, setData] = useState<KolamStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKolamData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(`${apiUrl}/leles`, { headers });
        const result = await response.json();

        const kolams = Array.isArray(result?.data)
          ? result.data
          : result?.data?.data || [];

        const statusCount: KolamStatus = {
          kosong: 0,
          sedang_budidaya: 0,
          siap_panen: 0,
        };

        kolams.forEach((kolam: any) => {
          const hariKe = kolam.hari_ke || kolam.hariKe || 0;
          const status = kolam.status || "kosong";

          if (status === "kosong") {
            statusCount.kosong++;
          } else if (kolam.budidaya && hariKe >= 90) {
            statusCount.siap_panen++;
          } else if (kolam.budidaya || status === "sedang_budidaya") {
            statusCount.sedang_budidaya++;
          }
        });

        setData(statusCount);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Error");
        setLoading(false);
      }
    };

    fetchKolamData();
  }, [apiUrl]);

  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert message={error} type="error" showIcon />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <Empty description="Tidak ada data kolam" />
      </Card>
    );
  }

  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  // ✅ FIX: Map warna ke tipe status
  const colorMap: { [key: string]: string } = {
    "Kosong": "#1890ff",           // Biru
    "Sedang Budidaya": "#ff7a45",  // Orange
    "Siap Panen": "#52c41a",       // Hijau
  };

  const chartData = [
    { type: "Kosong", value: data.kosong || 0 },
    { type: "Sedang Budidaya", value: data.sedang_budidaya || 0 },
    { type: "Siap Panen", value: data.siap_panen || 0 },
  ];

  const config = {
    data: chartData,
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    label: {
      text: (datum: any) => {
        const value = datum?.value || 0;
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return `${value} (${percentage.toFixed(1)}%)`;
      },
      position: "outside" as const,
      style: {
        fill: "#666",
        fontSize: 12,
        fontWeight: 500,
      },
    },
    legend: {
      position: "bottom" as const,
      layout: "horizontal" as const,
      itemName: {
        style: {
          fill: "#666",
          fontSize: 12,
        },
      },
    },
    // ✅ FIX: Map color dengan tipe
    color: (datum: any) => colorMap[datum.type] || "#999",
    tooltip: {
      showTitle: true,
      // ✅ PERBAIKAN: Ganti parameter title dengan data yang benar
      title: (data: any) => `Status: ${data.type || data[0]?.data?.type || 'Data'}`,
      formatter: (datum: any) => {
        const value = datum.value || 0;
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return {
          name: datum.type,
          value: `${value} kolam (${percentage.toFixed(1)}%)`,
        };
      },
    },
    annotations:
      total > 0
        ? [
            {
              type: "text",
              style: {
                text: `Total\n${total} Kolam`,
                x: "50%",
                y: "50%",
                textAlign: "center",
                fontSize: 14,
                fontWeight: "bold",
                fill: "#666",
              },
            },
          ]
        : [],
    interactions: [{ type: "element-active" }, { type: "pie-legend-active" }],
  };

  return (
    <Card
      title={
        <Space>
          <PieChartOutlined />
          <span>Status Kolam Lele</span>
        </Space>
      }
      style={{ height: "100%" }}
      extra={
        total > 0 && (
          <Text type="secondary">
            Total: <Text strong>{total}</Text> kolam
          </Text>
        )
      }
    >
      {total === 0 ? (
        <Empty
          description="Belum ada data kolam"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: "40px 0" }}
        />
      ) : (
        <div style={{ height: 350, display: "flex", justifyContent: "center" }}>
          <Pie {...config} />
        </div>
      )}
    </Card>
  );
};