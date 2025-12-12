"use client";

import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Select,
  Space,
  Empty,
  Skeleton,
  Button,
  message,
  Tag,
  Tabs,
} from "antd";
import {
  DollarOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useApiUrl } from "@refinedev/core";
import { useState, useEffect } from "react";
import Typography from "antd/es/typography";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const { Title, Text } = Typography;

interface FinanceData {
  periode: string;
  month: number;
  year: number;
  ringkasan: {
    modal: {
      material: number;
      kambing: number;
      total: number;
    };
    omset: {
      material: number;
      kambing: number;
      total: number;
    };
    profit: {
      material: number;
      kambing: number;
      total: number;
    };
  };
  detail: {
    material: Array<{
      nama_produk: string;
      harga_beli: number;
      harga_jual: number;
      jumlah_terjual: number;
      modal: number;
      omset: number;
      profit: number;
    }>;
    kambing: Array<{
      nama_produk: string;
      harga_beli: number;
      harga_jual: number;
      jumlah_terjual: number;
      modal: number;
      omset: number;
      profit: number;
    }>;
  };
}

interface TrendData {
  periode: string;
  month: number;
  year: number;
  ringkasan: {
    modal: {
      material: number;
      kambing: number;
      total: number;
    };
    omset: {
      material: number;
      kambing: number;
      total: number;
    };
    profit: {
      material: number;
      kambing: number;
      total: number;
    };
  };
}

const COLORS = {
  material: "#1890ff",
  kambing: "#52c41a",
  profit: "#faad14",
  loss: "#f5222d",
};

export const FinanceDashboard = () => {
  const apiUrl = useApiUrl();
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"material" | "kambing">("material");

  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  // Generate array bulan
  const months = Array.from({ length: 12 }, (_, i) => ({
    label: dayjs().month(i).format("MMMM"),
    value: i + 1,
  }));

  // Generate array tahun (5 tahun terakhir)
  const currentYear = dayjs().year();
  const years = Array.from({ length: 5 }, (_, i) => ({
    label: (currentYear - i).toString(),
    value: currentYear - i,
  }));

  // Fetch finance data untuk bulan tertentu
  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${apiUrl}/finance/report?month=${selectedMonth}&year=${selectedYear}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch finance data");
        }

        const result = await response.json();
        setFinanceData(result.data);
      } catch (error) {
        console.error("Error fetching finance data:", error);
        message.error("Gagal mengambil data keuangan");
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, [apiUrl, selectedMonth, selectedYear]);

  // Fetch trend data untuk 12 bulan terakhir
  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        setTrendLoading(true);
        const trendArray: any[] = [];

        // Ambil 12 bulan terakhir
        for (let i = 11; i >= 0; i--) {
          const date = dayjs().subtract(i, "months");
          const month = date.month() + 1;
          const year = date.year();

          try {
            const response = await fetch(
              `${apiUrl}/finance/report?month=${month}&year=${year}`
            );

            if (response.ok) {
              const result = await response.json();
              const data = result.data;

              trendArray.push({
                bulan: date.format("MMM YY"),
                modal: data.ringkasan.modal.total,
                omset: data.ringkasan.omset.total,
                profit: data.ringkasan.profit.total,
                modalMaterial: data.ringkasan.modal.material,
                modalKambing: data.ringkasan.modal.kambing,
                omsetMaterial: data.ringkasan.omset.material,
                omsetKambing: data.ringkasan.omset.kambing,
              });
            }
          } catch (error) {
            console.error(`Error fetching data for ${month}/${year}:`, error);
          }
        }

        setTrendData(trendArray);
      } catch (error) {
        console.error("Error fetching trend data:", error);
        message.error("Gagal mengambil data trend");
      } finally {
        setTrendLoading(false);
      }
    };

    fetchTrendData();
  }, [apiUrl]);

  const handleExportExcel = () => {
    message.info("Fitur export Excel sedang dalam pengembangan");
  };

  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Col xs={24} sm={12} lg={8} key={`skeleton-${i}`}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Col>
        ))}
      </Row>
    );
  }

  if (!financeData) {
    return <Empty description="Data keuangan tidak tersedia" />;
  }

  const materialData = financeData.detail.material;
  const kambingData = financeData.detail.kambing;
  const currentData = activeTab === "material" ? materialData : kambingData;

  const materialColumns = [
    {
      title: "Nama Produk",
      dataIndex: "nama_produk",
      key: "nama_produk",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Harga Beli",
      dataIndex: "harga_beli",
      key: "harga_beli",
      render: (value: number) => (
        <Text>Rp {value.toLocaleString("id-ID")}</Text>
      ),
    },
    {
      title: "Harga Jual",
      dataIndex: "harga_jual",
      key: "harga_jual",
      render: (value: number) => (
        <Text>Rp {value.toLocaleString("id-ID")}</Text>
      ),
    },
    {
      title: "Qty Terjual",
      dataIndex: "jumlah_terjual",
      key: "jumlah_terjual",
      render: (value: number) => <Text strong>{value}</Text>,
    },
    {
      title: "Modal",
      dataIndex: "modal",
      key: "modal",
      render: (value: number) => (
        <Text type="danger">Rp {value.toLocaleString("id-ID")}</Text>
      ),
    },
    {
      title: "Omset",
      dataIndex: "omset",
      key: "omset",
      render: (value: number) => (
        <Text type="success">Rp {value.toLocaleString("id-ID")}</Text>
      ),
    },
    {
      title: "Profit",
      dataIndex: "profit",
      key: "profit",
      render: (value: number) => {
        const color = value >= 0 ? "#52c41a" : "#f5222d";
        return (
          <Text style={{ color, fontWeight: "bold" }}>
            Rp {value.toLocaleString("id-ID")}
          </Text>
        );
      },
    },
  ];

  // Data untuk pie chart (perbandingan material vs kambing)
  const comparisonData = [
    {
      name: "Material",
      value: financeData.ringkasan.profit.material,
      omset: financeData.ringkasan.omset.material,
      modal: financeData.ringkasan.modal.material,
    },
    {
      name: "Kambing",
      value: financeData.ringkasan.profit.kambing,
      omset: financeData.ringkasan.omset.kambing,
      modal: financeData.ringkasan.modal.kambing,
    },
  ];

  return (
    <div style={{ padding: "24px 0" }}>
      {/* 📅 Filter Section */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Title level={4}>📊 Laporan Keuangan</Title>
          <Space>
            <Select
              style={{ width: 150 }}
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={months}
              placeholder="Pilih Bulan"
            />
            <Select
              style={{ width: 120 }}
              value={selectedYear}
              onChange={setSelectedYear}
              options={years}
              placeholder="Pilih Tahun"
            />
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
            >
              Export Excel
            </Button>
          </Space>
          <Text type="secondary">
            Periode: <strong>{financeData.periode}</strong>
          </Text>
        </Space>
      </Card>

      {/* 💰 Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {/* Modal */}
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable>
            <Statistic
              title="Modal Pembelian"
              value={financeData.ringkasan.modal.total}
              prefix={<DollarOutlined />}
              suffix="Rp"
              valueStyle={{ color: "#f5222d", fontSize: "16px" }}
              formatter={(value: any) =>
                `${(value as number).toLocaleString("id-ID")}`
              }
            />
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Material:{" "}
                </Text>
                <div>
                  <Text>
                    Rp{" "}
                    {financeData.ringkasan.modal.material.toLocaleString(
                      "id-ID"
                    )}
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Kambing:{" "}
                </Text>
                <div>
                  <Text>
                    Rp{" "}
                    {financeData.ringkasan.modal.kambing.toLocaleString(
                      "id-ID"
                    )}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Omset */}
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable>
            <Statistic
              title="Omset (Penjualan)"
              value={financeData.ringkasan.omset.total}
              prefix={<DollarOutlined />}
              suffix="Rp"
              valueStyle={{ color: "#52c41a", fontSize: "16px" }}
              formatter={(value: any) =>
                `${(value as number).toLocaleString("id-ID")}`
              }
            />
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Material:{" "}
                </Text>
                <div>
                  <Text>
                    Rp{" "}
                    {financeData.ringkasan.omset.material.toLocaleString(
                      "id-ID"
                    )}
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Kambing:{" "}
                </Text>
                <div>
                  <Text>
                    Rp{" "}
                    {financeData.ringkasan.omset.kambing.toLocaleString(
                      "id-ID"
                    )}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Profit */}
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable>
            <Statistic
              title="Profit (Keuntungan)"
              value={financeData.ringkasan.profit.total}
              prefix={<DollarOutlined />}
              suffix="Rp"
              valueStyle={{
                color:
                  financeData.ringkasan.profit.total >= 0
                    ? "#52c41a"
                    : "#f5222d",
                fontSize: "16px",
              }}
              formatter={(value: any) =>
                `${(value as number).toLocaleString("id-ID")}`
              }
            />
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Material:{" "}
                </Text>
                <div>
                  <Text
                    style={{
                      color:
                        financeData.ringkasan.profit.material >= 0
                          ? "#52c41a"
                          : "#f5222d",
                    }}
                  >
                    Rp{" "}
                    {financeData.ringkasan.profit.material.toLocaleString(
                      "id-ID"
                    )}
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Kambing:{" "}
                </Text>
                <div>
                  <Text
                    style={{
                      color:
                        financeData.ringkasan.profit.kambing >= 0
                          ? "#52c41a"
                          : "#f5222d",
                    }}
                  >
                    Rp{" "}
                    {financeData.ringkasan.profit.kambing.toLocaleString(
                      "id-ID"
                    )}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 📈 Grafik Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {/* Trend Line Chart - Modal, Omset, Profit */}
        <Col xs={24} lg={12}>
          <Card
            title={<Title level={4}>📈 Trend Keuangan (12 Bulan)</Title>}
            loading={trendLoading}
          >
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
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
                    dataKey="modal"
                    stroke="#f5222d"
                    name="Modal"
                    strokeWidth={2}
                  />
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
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Data trend tidak tersedia" />
            )}
          </Card>
        </Col>

        {/* Comparison Bar Chart - Material vs Kambing */}
        <Col xs={24} lg={12}>
          <Card
            title={<Title level={4}>📊 Perbandingan Material vs Kambing</Title>}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) =>
                    `Rp ${(value as number).toLocaleString("id-ID")}`
                  }
                />
                <Legend />
                <Bar dataKey="modal" fill="#f5222d" name="Modal" />
                <Bar dataKey="omset" fill="#52c41a" name="Omset" />
                <Bar dataKey="value" fill="#1890ff" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 🥧 Pie Chart - Persentase Profit */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={12}>
          <Card title={<Title level={4}>🥧 Distribusi Profit</Title>}>
            {comparisonData.some((item) => item.value !== 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={comparisonData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) =>
                      `${name}: Rp ${(value as number).toLocaleString("id-ID")}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={COLORS.material} />
                    <Cell fill={COLORS.kambing} />
                  </Pie>
                  <Tooltip
                    formatter={(value: any) =>
                      `Rp ${(value as number).toLocaleString("id-ID")}`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Belum ada profit" />
            )}
          </Card>
        </Col>

        {/* Bar Chart - Material vs Kambing (Breakdown) */}
        <Col xs={24} lg={12}>
          <Card
            title={<Title level={4}>📊 Breakdown Modal & Omset</Title>}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: "Material",
                    Modal: financeData.ringkasan.modal.material,
                    Omset: financeData.ringkasan.omset.material,
                  },
                  {
                    name: "Kambing",
                    Modal: financeData.ringkasan.modal.kambing,
                    Omset: financeData.ringkasan.omset.kambing,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) =>
                    `Rp ${(value as number).toLocaleString("id-ID")}`
                  }
                />
                <Legend />
                <Bar dataKey="Modal" fill="#f5222d" />
                <Bar dataKey="Omset" fill="#52c41a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 📋 Detail Table */}
      <Card
        title={
          <Title level={4}>
            {activeTab === "material" ? "📦 Detail Material" : "🐐 Detail Kambing"}
          </Title>
        }
        extra={
          <Space>
            <Tag
              color={activeTab === "material" ? "blue" : "default"}
              onClick={() => setActiveTab("material")}
              style={{ cursor: "pointer", padding: "6px 12px" }}
            >
              Material ({materialData.length})
            </Tag>
            <Tag
              color={activeTab === "kambing" ? "blue" : "default"}
              onClick={() => setActiveTab("kambing")}
              style={{ cursor: "pointer", padding: "6px 12px" }}
            >
              Kambing ({kambingData.length})
            </Tag>
          </Space>
        }
      >
        {currentData.length > 0 ? (
          <Table
            dataSource={currentData}
            columns={materialColumns}
            pagination={{
              pageSize: 10,
              total: currentData.length,
              showTotal: (total) => `Total ${total} produk`,
            }}
            rowKey="nama_produk"
            size="middle"
            scroll={{ x: 1200 }}
          />
        ) : (
          <Empty description={`Belum ada data ${activeTab}`} />
        )}
      </Card>
    </div>
  );
};