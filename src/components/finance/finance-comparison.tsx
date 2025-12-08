// finance-comparison.tsx - FIXED STATE MANAGEMENT
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
  profitMaterial: number;
  profitKambing: number;
  profitLele: number;
}

export const FinanceComparison = () => {
  const apiUrl = useApiUrl();
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTrendData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Ambil 6 bulan mundur
        const months = [...Array(6)].map((_, i) => {
          const date = dayjs().subtract(5 - i, "months");
          return {
            date,
            month: date.month() + 1,
            year: date.year(),
          };
        });

        // Paralel fetch semua bulan
        const responses = await Promise.all(
          months.map(({ month, year }) =>
            fetch(`${apiUrl}/finance/summary?month=${month}&year=${year}`, {
              headers,
              signal: controller.signal,
            }).then((res) => (res.ok ? res.json() : null))
          )
        );

        // Map hasil respons → TrendPoint[]
        const parsedData: TrendPoint[] = responses
          .map((res, idx) => {
            if (!res?.data?.ringkasan) return null;

            const ringkasan = res.data.ringkasan;
            const { date } = months[idx];

            return {
              bulan: date.format("MMM YY"),
              profitMaterial: Number(ringkasan.profit?.material) || 0,
              profitKambing: Number(ringkasan.profit?.kambing) || 0,
              profitLele: Number(ringkasan.profit?.lele) || 0,
            };
          })
          .filter(Boolean) as TrendPoint[];

        if (parsedData.length === 0) {
          setError("Tidak ada data keuangan");
        } else {
          setTrendData(parsedData);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Gagal memuat data keuangan");
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();

    return () => controller.abort();
  }, [apiUrl]);

  if (loading) {
    return (
      <Card title={<Title level={4}>📈 Tren Profit (6 Bulan)</Title>}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title={<Title level={4}>📈 Tren Profit (6 Bulan)</Title>}>
        <Alert message={error} type="warning" showIcon />
      </Card>
    );
  }

  if (trendData.length === 0) {
    return (
      <Card title={<Title level={4}>📈 Tren Profit (6 Bulan)</Title>}>
        <Empty description="Belum ada data" />
      </Card>
    );
  }

  return (
    <Card title={<Title level={4}>📈 Tren Profit Per Kategori (6 Bulan)</Title>}>
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
            dataKey="profitMaterial"
            stroke="#52c41a"
            name="📦 Profit Material"
            strokeWidth={2}
            dot={{ r: 4 }}
          />

          <Line
            type="monotone"
            dataKey="profitKambing"
            stroke="#ff7a45"
            name="🐐 Profit Kambing"
            strokeWidth={2}
            dot={{ r: 4 }}
          />

          <Line
            type="monotone"
            dataKey="profitLele"
            stroke="#1890ff"
            name="🐟 Profit Lele"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
