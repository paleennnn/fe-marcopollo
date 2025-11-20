"use client";

import { Card, Col, Row, Statistic, Table, Empty, Skeleton, Space } from "antd";
import { DollarOutlined, ShoppingOutlined } from "@ant-design/icons";
import { useApiUrl, useGetIdentity, useList } from "@refinedev/core";
import { useState, useEffect } from "react";
import Typography from "antd/es/typography";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface CustomerStats {
  totalBelanja: number;
  totalOrder: number;
  recentOrders: any[];
}

export const CustomerWallet = () => {
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<any>();
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerStats = async () => {
      try {
        setLoading(true);

        // Fetch orders dari customer
        const response = await fetch(`${apiUrl}/customer/orders`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch orders");

        const data = await response.json();
        const orders = data.data || [];

        // Filter hanya yang selesai
        const completedOrders = orders.filter(
          (order: any) => order.status === "selesai"
        );

        const totalBelanja = completedOrders.reduce(
          (sum: number, order: any) => sum + (order.total_harga || 0),
          0
        );

        setStats({
          totalBelanja,
          totalOrder: completedOrders.length,
          recentOrders: completedOrders.slice(0, 10),
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching customer stats:", error);
        setLoading(false);
      }
    };

    if (identity?.id) {
      fetchCustomerStats();
    }
  }, [apiUrl, identity]);

  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        {[1, 2].map((i) => (
          <Col xs={24} sm={12} key={i}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <div style={{ padding: "24px 0" }}>
      <Title level={3}>💰 Ringkasan Belanja Anda</Title>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12}>
          <Card hoverable>
            <Statistic
              title="Total Belanja"
              value={stats?.totalBelanja || 0}
              prefix={<DollarOutlined />}
              suffix="Rp"
              valueStyle={{ color: "#1890ff" }}
              formatter={(value: any) =>
                `${(value as number).toLocaleString("id-ID")}`
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12}>
          <Card hoverable>
            <Statistic
              title="Total Pesanan Selesai"
              value={stats?.totalOrder || 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card title={<Title level={4}>📋 Riwayat Pesanan</Title>}>
        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <Table
            dataSource={stats.recentOrders}
            columns={[
              {
                title: "No. Order",
                dataIndex: "nomor_order",
                key: "nomor_order",
                render: (text) => <Text strong>{text}</Text>,
              },
              {
                title: "Total",
                dataIndex: "total_harga",
                key: "total_harga",
                render: (value) => (
                  <Text>Rp {value?.toLocaleString("id-ID")}</Text>
                ),
              },
              {
                title: "Tanggal",
                dataIndex: "tanggal_order",
                key: "tanggal_order",
                render: (date) => dayjs(date).format("DD MMM YYYY HH:mm"),
              },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                render: (status) => (
                  <span style={{ color: "#52c41a", fontWeight: "bold" }}>
                    {status === "selesai" ? "✓ Selesai" : status}
                  </span>
                ),
              },
            ]}
            pagination={{ pageSize: 10 }}
            size="middle"
            rowKey="id_order"
          />
        ) : (
          <Empty description="Belum ada pesanan" />
        )}
      </Card>
    </div>
  );
};