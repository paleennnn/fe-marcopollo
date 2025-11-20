// finance-comparison.tsx - PERBAIKI DENGAN STATE MANAGEMENT
"use client";

import { Card, Skeleton, Empty, Alert } from "antd";
import { useApiUrl } from "@refinedev/core";
import { useState, useEffect } from "react";
import Typography from "antd/es/typography";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const { Title } = Typography;

interface TrendPoint {
  bulan: string;
  profit: number;
  omset: number;
  modal: number;
}

export const FinanceComparison = () => {
  const apiUrl = useApiUrl();
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTrendData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const trendArray: TrendPoint[] = [];

        // Fetch 6 bulan terakhir
        for (let i = 5; i >= 0; i--) {
          const date = dayjs().subtract(i, "months");
          const month = date.month() + 1;
          const year = date.year();

          try {
            const response = await fetch(
              `${apiUrl}/finance/summary?month=${month}&year=${year}`,
              { headers }
            );

            if (response.ok) {
              const result = await response.json();
              const ringkasan = result.data?.ringkasan;

              if (ringkasan) {
                trendArray.push({
                  bulan: date.format("MMM YY"),
                  profit: Number(ringkasan.profit?.total) || 0,
                  omset: Number(ringkasan.omset?.total) || 0,
                  modal: Number(ringkasan.modal?.total) || 0,
                });
              }
            }
          } catch (error) {
            console.error(`Error fetch ${month}/${year}:`, error);
          }
        }

        if (isMounted) {
          if (trendArray.length === 0) {
            setError("Tidak ada data keuangan");
          } else {
            setTrendData(trendArray);
          }
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setError(error instanceof Error ? error.message : "Error");
          setLoading(false);
        }
      }
    };

    fetchTrendData();

    return () => {
      isMounted = false;
    };
  }, [apiUrl]);

  if (loading) {
    return (
      <Card title={<Title level={4}>📈 Tren Keuangan (6 Bulan)</Title>}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title={<Title level={4}>📈 Tren Keuangan (6 Bulan)</Title>}>
        <Alert message={error} type="warning" showIcon />
      </Card>
    );
  }

  if (trendData.length === 0) {
    return (
      <Card title={<Title level={4}>📈 Tren Keuangan (6 Bulan)</Title>}>
        <Empty description="Belum ada data" />
      </Card>
    );
  }

  return (
    <Card title={<Title level={4}>📈 Tren Keuangan (6 Bulan)</Title>}>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bulan" />
          <YAxis />
          <Tooltip
            formatter={(value: any) =>
              `Rp ${(value as number).toLocaleString("id-ID")}`
            }
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="omset"
            stroke="#52c41a"
            name="Omset"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#1890ff"
            name="Profit"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="modal"
            stroke="#f5222d"
            name="Modal"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};