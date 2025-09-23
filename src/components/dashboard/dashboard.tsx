"use client";

import React, { useState, useEffect } from "react";
import {
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  Tabs,
  Spin,
  Empty,
  List,
  Tag,
} from "antd";
import {
  ShoppingCartOutlined,
  DatabaseOutlined,
  DollarOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  // fetch data dari backend public API
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3333/api/public/dashboard-overview").then((res) =>
        res.json()
      ),
      fetch("http://localhost:3333/api/public/dashboard-chart").then((res) =>
        res.json()
      ),
    ])
      .then(([overview, chart]) => {
        setOverviewData(overview);
        setChartData(chart);
      })
      .finally(() => setLoading(false));
  }, []);

  // ringkasan
  const renderOverview = () => {
    if (loading) return <Spin size="large" />;
    if (!overviewData) return <Empty description="Tidak ada data" />;

    return (
      <>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Kambing"
                value={overviewData.total_kambing}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Material"
                value={overviewData.total_material}
                prefix={<HomeOutlined />}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Penjualan Bulan Ini"
                value={overviewData.total_penjualan_bulan}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Pembelian Bulan Ini"
                value={overviewData.total_pembelian_bulan}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Chart penjualan/pembelian */}
        <Card title="Statistik Penjualan & Pembelian per Bulan">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bulan" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="penjualan" fill="#52c41a" />
              <Bar dataKey="pembelian" fill="#faad14" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </>
    );
  };

  // list kambing terbaru
  const renderKambing = () => {
    if (loading) return <Spin size="large" />;
    if (!overviewData?.kambing_terbaru) return <Empty />;

    return (
      <List
        header={<Title level={4}>Kambing Terbaru</Title>}
        dataSource={overviewData.kambing_terbaru}
        renderItem={(item: any) => (
          <List.Item>
            <List.Item.Meta
              title={item.nama_kambing}
              description={`Rp ${item.harga.toLocaleString("id-ID")}`}
            />
            <Tag color="blue">{item.umur} bln</Tag>
          </List.Item>
        )}
      />
    );
  };

  // list material terbaru
  const renderMaterial = () => {
    if (loading) return <Spin size="large" />;
    if (!overviewData?.material_terbaru) return <Empty />;

    return (
      <List
        header={<Title level={4}>Material Terbaru</Title>}
        dataSource={overviewData.material_terbaru}
        renderItem={(item: any) => (
          <List.Item>
            <List.Item.Meta
              title={item.nama_material}
              description={`Rp ${item.harga_satuan.toLocaleString("id-ID")}`}
            />
            <Tag color="purple">stok {item.stok}</Tag>
          </List.Item>
        )}
      />
    );
  };

  return (
    <div>
      <Title level={2}>📊 Dashboard Marcopollo Group</Title>
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        <TabPane tab="Ringkasan" key="overview">
          {renderOverview()}
        </TabPane>
        <TabPane tab="Kambing" key="kambing">
          {renderKambing()}
        </TabPane>
        <TabPane tab="Material" key="material">
          {renderMaterial()}
        </TabPane>
      </Tabs>
    </div>
  );
};
