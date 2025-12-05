"use client";

import { Column } from "@ant-design/charts";
import { Card, Typography, Select, Space, Row, Col, Skeleton, Empty, Alert } from "antd";
import { BarChartOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useApiUrl } from "@refinedev/core";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface RevenueData {
  period: string;
  revenue: number;
  orders: number;
  month?: number;
  year?: number;
  day?: number;
}

export const BarChartRevenue = () => {
  const apiUrl = useApiUrl();
  const [data, setData] = useState<RevenueData[]>([]);
  const [dailyData, setDailyData] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">("year");

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const currentYear = dayjs().year();
        const currentMonth = dayjs().month() + 1;

        // Fetch monthly data
        const monthPromises = [];
        for (let month = 1; month <= 12; month++) {
          const url = `${apiUrl}/finance/summary?month=${month}&year=${currentYear}`;
          monthPromises.push(
            fetch(url, { headers })
              .then((res) => res.json())
              .then((result) => ({
                month,
                data: result?.data || null,
              }))
              .catch(() => ({ month, data: null }))
          );
        }

        const monthResults = await Promise.all(monthPromises);

        // Process monthly data
        const revenueData: RevenueData[] = monthResults.map(({ month, data: monthData }) => {
          const monthName = dayjs().month(month - 1).format("MMM");
          const revenue = monthData?.ringkasan?.omset?.total || 0;

          return {
            period: monthName,
            revenue: Number(revenue) || 0,
            orders: 0,
            month,
            year: currentYear,
          };
        });

        setData(revenueData);

        // Fetch daily data untuk bulan ini
        try {
          const dailyRes = await fetch(
            `${apiUrl}/finance/daily-revenue?month=${currentMonth}&year=${currentYear}`,
            { headers }
          );

          if (dailyRes.ok) {
            const dailyResult = await dailyRes.json();
            const daily = dailyResult?.data?.daily || {};
            setDailyData(daily);
          } else {
            setDailyData({});
          }
        } catch {
          setDailyData({});
        }

        setLoading(false);
      } catch (err: any) {
        setError(err?.message || "Gagal memuat data revenue");
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [apiUrl, timeRange]);

  // Filter data berdasarkan timeRange
  const getFilteredData = (): RevenueData[] => {
    const currentMonth = dayjs().month() + 1;
    const currentYear = dayjs().year();

    switch (timeRange) {
      case "month":
        // Gunakan real daily data dari DB
        const daysInMonth = dayjs().month(currentMonth - 1).daysInMonth();
        const dailyDataArray: RevenueData[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = dayjs()
            .year(currentYear)
            .month(currentMonth - 1)
            .date(day)
            .format("YYYY-MM-DD");

          const revenue = dailyData[dateStr] || 0;

          dailyDataArray.push({
            period: `${day} ${dayjs().month(currentMonth - 1).format("MMM")}`,
            revenue: Number(revenue),
            orders: 0,
            month: currentMonth,
            year: currentYear,
            day,
          });
        }
        return dailyDataArray;

      case "quarter":
        const quarterMonth = Math.ceil(currentMonth / 3) * 3;
        const quarterStart = quarterMonth - 2;
        return data.slice(quarterStart - 1, quarterMonth);

      case "year":
      default:
        return data;
    }
  };

  const filteredData = getFilteredData();

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
        <Alert message="Error" description={error} type="error" showIcon />
      </Card>
    );
  }

  if (!filteredData || filteredData.length === 0) {
    return (
      <Card>
        <Empty description="Belum ada data revenue" />
      </Card>
    );
  }

  // ✅ Format function yang aman
  const formatCurrency = (value: number) => {
    if (!value || value === 0 || isNaN(value)) return null;
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}Jt`;
    } else if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(0)}Rb`;
    }
    return `Rp ${value}`;
  };

  // ✅ Format khusus untuk label di bar chart - tanpa "Rp"
  const formatCurrencyShort = (value: number) => {
    if (!value || value === 0 || isNaN(value)) return "";
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}Jt`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}Rb`;
    }
    return `${value}`;
  };

  const config = {
    data: filteredData,
    xField: "period",
    yField: "revenue",
    label: {
      position: "top" as const,
      style: {
        fill: "#000000",
        opacity: 0.6,
        fontSize: 11,
        fontWeight: 500,
      },
      // ✅ FIX: Format label jadi "26.2Jt" (tanpa Rp)
      content: (datum: any) => {
        const value = datum?.revenue || 0;
        if (value === 0) return "";
        return formatCurrencyShort(value);
      },
    },
    xAxis: {
      type: "band" as const,
      label: {
        autoHide: timeRange === "month",
        autoRotate: true,
      },
    },
    yAxis: {
      label: {
        formatter: (v: any) => {
          if (v === 0) return "0";
          return formatCurrency(v) || "Rp 0";
        },
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        const value = datum?.revenue || 0;
        return {
          name: "Revenue",
          value: formatCurrency(value) || "Rp 0",
        };
      },
    },
    color: (datum: any) => {
      const revenues = filteredData.map((d: any) => d.revenue).filter((r) => r > 0);
      if (revenues.length === 0) return "#f0f0f0";

      const maxValue = Math.max(...revenues);
      const minValue = Math.min(...revenues);
      const isMax = datum.revenue === maxValue && datum.revenue > 0;
      const isMin = datum.revenue === minValue && datum.revenue > 0;
      const isEmpty = datum.revenue === 0;

      if (isEmpty) return "#f0f0f0";
      if (isMax) return "#1890ff";
      if (isMin) return "#f5222d";
      return "#91d5ff";
    },
    animation: {
      appear: {
        animation: "fade-in",
        duration: 800,
      },
    },
  };

  const validRevenues = filteredData.map((d) => d.revenue).filter((r) => r > 0);
  const getCurrentData = () => {
    if (timeRange === "month") {
      return [...filteredData].reverse().find((d) => d.revenue > 0) || filteredData[filteredData.length - 1];
    }
    return filteredData[filteredData.length - 1];
  };

  const currentData = getCurrentData();
  const previousData = filteredData.length > 1 ? filteredData[filteredData.length - 2] : null;

  const averageRevenue =
    validRevenues.length > 0
      ? validRevenues.reduce((a, b) => a + b, 0) / validRevenues.length
      : 0;
  const maxRevenue = validRevenues.length > 0 ? Math.max(...validRevenues) : 0;
  const totalRevenue = filteredData.reduce((sum, d) => sum + (d.revenue || 0), 0);

  const growthPercent =
    previousData && previousData.revenue > 0
      ? (((currentData.revenue - previousData.revenue) / previousData.revenue) * 100).toFixed(1)
      : "0";

  return (
    <Card
      title={
        <Space>
          <BarChartOutlined />
          <span>💰 Revenue Tahunan</span>
        </Space>
      }
      extra={
        <Select
          value={timeRange}
          onChange={(value) => setTimeRange(value as any)}
          size="small"
          style={{ width: 120 }}
        >
          <Select.Option value="month">Bulan Ini</Select.Option>
          <Select.Option value="quarter">Kuartal</Select.Option>
          <Select.Option value="year">Tahunan</Select.Option>
        </Select>
      }
      style={{ height: "100%" }}
    >
      <div style={{ height: 320, marginBottom: 24 }}>
        <Column {...config} />
      </div>

      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Text type="secondary">Revenue Terkini</Text>
            <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
              {formatCurrency(currentData?.revenue || 0) || "Rp 0"}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {currentData?.period || ""}
            </Text>
          </Space>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Text type="secondary">Rata-rata Revenue</Text>
            <Title level={4} style={{ margin: 0, color: "#52c41a" }}>
              {formatCurrency(averageRevenue) || "Rp 0"}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Per periode
            </Text>
          </Space>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Text type="secondary">Revenue Tertinggi</Text>
            <Title level={4} style={{ margin: 0, color: "#faad14" }}>
              {formatCurrency(maxRevenue) || "Rp 0"}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Peak revenue
            </Text>
          </Space>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Text type="secondary">Total Revenue</Text>
            <Title
              level={4}
              style={{
                margin: 0,
                color: Number(growthPercent) >= 0 ? "#52c41a" : "#f5222d",
              }}
            >
              {formatCurrency(totalRevenue) || "Rp 0"}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {growthPercent}% {Number(growthPercent) >= 0 ? "↑" : "↓"}
            </Text>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default BarChartRevenue;