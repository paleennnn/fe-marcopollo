"use client";

import { Line } from "@ant-design/charts";
import { Card, Typography, Select, Space, Row, Col, Statistic, Skeleton } from "antd";
import { LineChartOutlined, RiseOutlined, DollarOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";

const { Title, Text } = Typography;
const { Option } = Select;

export const LineChartTrend = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<"orders" | "revenue" | "profit">("revenue");

  useEffect(() => {
    setTimeout(() => {
      const mockData = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const day = date.getDate();
        const month = date.getMonth() + 1;

        const baseOrders = Math.floor(Math.random() * 10) + 5;
        const baseRevenue = baseOrders * (Math.random() * 500000 + 200000);
        const baseProfit = baseRevenue * (Math.random() * 0.3 + 0.2);

        return {
          date: `${day}/${month}`,
          orders: baseOrders,
          revenue: Math.round(baseRevenue),
          profit: Math.round(baseProfit),
          day: day,
          weekday: date.toLocaleDateString("id-ID", { weekday: "short" }),
        };
      });

      setData(mockData);
      setLoading(false);
    }, 500);
  }, []);

  const config = {
    data,
    xField: "date",
    yField: metric,
    smooth: true,
    point: {
      size: 4,
      shape: "circle",
    },
    lineStyle: {
      lineWidth: 3,
    },
    xAxis: {
      label: {
        formatter: (text: string, item: any, index: number) => {
          return index % 5 === 0 ? text : "";
        },
      },
    },
    yAxis: {
      label: {
        formatter: (v: any) => {
          if (metric === "orders") return v;
          return `Rp ${(v / 1000000).toFixed(1)}Jt`;
        },
      },
    },
    tooltip: {
      title: (title: string) => `Tanggal ${title}`,
      items: [
        {
          channel: "y",
          name: metric === "orders" ? "Pesanan" : metric === "revenue" ? "Revenue" : "Profit",
          valueFormatter: (v: any) => {
            if (metric === "orders") return `${v} order`;
            return `Rp ${v.toLocaleString("id-ID")}`;
          },
        },
      ],
    },
    color: metric === "orders" ? "#722ed1" : metric === "revenue" ? "#1890ff" : "#52c41a",
  };

  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalProfit = data.reduce((sum, d) => sum + d.profit, 0);

  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <LineChartOutlined />
          <span>Trend 30 Hari Terakhir</span>
        </Space>
      }
      extra={
        <Select
          value={metric}
          onChange={setMetric}
          size="small"
          style={{ width: 120 }}
        >
          <Option value="orders">Pesanan</Option>
          <Option value="revenue">Revenue</Option>
          <Option value="profit">Profit</Option>
        </Select>
      }
    >
      <div style={{ height: 250 }}>
        <Line {...config} />
      </div>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Statistic
            title="Total Pesanan"
            value={totalOrders}
            prefix={<RiseOutlined />}
            valueStyle={{ color: "#722ed1" }}
            suffix="order"
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Total Revenue"
            value={totalRevenue}
            prefix={<DollarOutlined />}
            valueStyle={{ color: "#1890ff" }}
            suffix="Rp"
            formatter={(value: any) => `${(value / 1000000).toFixed(1)}Jt`}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Total Profit"
            value={totalProfit}
            prefix={<DollarOutlined />}
            valueStyle={{ color: "#52c41a" }}
            suffix="Rp"
            formatter={(value: any) => `${(value / 1000000).toFixed(1)}Jt`}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default LineChartTrend;