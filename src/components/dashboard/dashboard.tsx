"use client";

import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Empty,
  Skeleton,
  Button,
  Space,
  Tag,
  Alert,
  Divider,
  Progress,
} from "antd";
import {
  ShoppingOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  ThunderboltFilled,
  CodeSandboxOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { FinanceComparison } from "@components/finance/finance-comparison";
import { CustomerWallet } from "@components/customer/customer-wallet";
import { PieChartStatus } from "@components/finance/pie-chart-status";
import { LineChartTrend } from "@components/finance/line-chart-trend";
import { BarChartRevenue } from "@components/finance/bar-chart-revenue";
import { useApiUrl, useNavigation, useGetIdentity } from "@refinedev/core";
import { useState, useEffect } from "react";
import Typography from "antd/es/typography";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface DashboardStats {
  totalKambing: number;
  totalMaterial: number;
  totalCustomer: number;
  totalOrdersBulanIni: number;
  totalRevenueBulanIni: number;
  totalProfitBulanIni: number;
}

export const Dashboard = () => {
  const apiUrl = useApiUrl();
  const { push } = useNavigation();
  const { data: identity, isLoading: identityLoading } = useGetIdentity<any>();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentKambings, setRecentKambings] = useState<any[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const currentMonth = dayjs().month() + 1;
  const currentYear = dayjs().year();

  const getUserRole = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return null;
      const parsed = JSON.parse(userStr);
      return (parsed.user || parsed).role;
    } catch {
      return null;
    }
  };

  const userRole = getUserRole();
  const isAdmin = userRole === "admin";
  const isCustomer = userRole === "customer";

  useEffect(() => {
    const fetchStats = async () => {
      if (isCustomer) {
        setStatsLoading(false);
        return;
      }

      try {
        setStatsLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const [kambingsRes, materialsRes, usersRes, ordersRes, financeRes] =
          await Promise.all([
            fetch(`${apiUrl}/kambings`, { headers }),
            fetch(`${apiUrl}/materials`, { headers }),
            fetch(`${apiUrl}/users`, { headers }),
            fetch(`${apiUrl}/orders`, { headers }),
            fetch(
              `${apiUrl}/finance/summary?month=${currentMonth}&year=${currentYear}`,
              { headers }
            ),
          ]);

        const kambings = await kambingsRes.json();
        const materials = await materialsRes.json();
        const users = await usersRes.json();
        const orders = await ordersRes.json();
        const finance = financeRes.ok ? await financeRes.json() : { data: null };

        const kambingsData = Array.isArray(kambings) ? kambings : kambings.data || [];
        const materialsData = Array.isArray(materials) ? materials : materials.data || [];
        const usersData = Array.isArray(users) ? users : users.data || [];

        let ordersData: any[] = [];
        if (Array.isArray(orders)) {
          ordersData = orders;
        } else if (orders?.data?.data && Array.isArray(orders.data.data)) {
          ordersData = orders.data.data;
        } else if (orders?.data && Array.isArray(orders.data)) {
          ordersData = orders.data;
        }

        const ordersThisMonth = ordersData.filter((order: any) => {
          const orderDate = dayjs(
            order.tanggalVerifikasi ||
              order.tanggal_verifikasi ||
              order.tanggalOrder ||
              order.tanggal_order ||
              order.created_at
          );
          const status = order.statusPembayaran || order.status_pembayaran || order.status;
          return (
            orderDate.month() + 1 === currentMonth &&
            orderDate.year() === currentYear &&
            status === "selesai"
          );
        });

        const financeData = finance?.data?.ringkasan;

        setStats({
          totalKambing: kambingsData?.length || 0,
          totalMaterial: materialsData?.length || 0,
          totalCustomer: usersData?.filter((u: any) => u.role === "customer").length || 0,
          totalOrdersBulanIni: ordersThisMonth.length,
          totalRevenueBulanIni: financeData?.omset?.total ?? 0,
          totalProfitBulanIni: financeData?.profit?.total ?? 0,
        });

        setRecentKambings(kambingsData?.slice(0, 5) || []);
        setRecentMaterials(materialsData?.slice(0, 5) || []);
        setRecentOrders(ordersThisMonth.slice(0, 5) || []);
        setStatsLoading(false);
      } catch (error: any) {
        setError(error?.message || "Gagal memuat data dashboard");
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [apiUrl, currentMonth, currentYear, isCustomer]);

  if (identityLoading || statsLoading) {
    return (
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Col xs={24} sm={12} lg={8} key={i}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Col>
        ))}
      </Row>
    );
  }

  if (error && isAdmin) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
        closable
      />
    );
  }

  return (
    <div style={{ padding: "24px 0" }}>
      {isAdmin && (
        <>
          {/* Header Section */}
          <Card
            style={{
              background: "#2c595a",
              color: "white",
              marginBottom: 32,
              border: "none",
            }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Title level={3} style={{ color: "white", marginBottom: 8 }}>
                  📊 Dashboard Keuangan
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  Periode: <strong>{dayjs().format("MMMM YYYY")}</strong>
                </Text>
              </Col>
              <Col xs={24} sm={12} style={{ textAlign: "right" }}>
                {/* <Button
                  type="primary"
                  onClick={() => push("/dashboard/finance")}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid white",
                  }}
                >
                  Detail Keuangan <ArrowRightOutlined />
                </Button> */}
              </Col>
            </Row>
          </Card>

          {/* KPI Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={12} lg={8}>
              <Card hoverable className="stat-card">
                <Statistic
                  title="🐐 Total Kambing"
                  value={stats?.totalKambing || 0}
                  valueStyle={{ color: "#ff7a45" }}
                  suffix="Ekor"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card hoverable className="stat-card">
                <Statistic
                  title="📦 Total Material"
                  value={stats?.totalMaterial || 0}
                  valueStyle={{ color: "#52c41a" }}
                  suffix="Produk"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card hoverable className="stat-card">
                <Statistic
                  title="👥 Total Customer"
                  value={stats?.totalCustomer || 0}
                  valueStyle={{ color: "#1890ff" }}
                  suffix="Orang"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card hoverable className="stat-card">
                <Statistic
                  title={`🛒 Pesanan ${dayjs().format("MMM")}`}
                  value={stats?.totalOrdersBulanIni || 0}
                  valueStyle={{ color: "#faad14" }}
                  suffix="Order"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card hoverable className="stat-card">
                <Statistic
                  title={`💰 Revenue ${dayjs().format("MMM")}`}
                  value={stats?.totalRevenueBulanIni || 0}
                  prefix="Rp "
                  valueStyle={{ color: "#f5222d", fontSize: 16 }}
                  formatter={(value: any) =>
                    `${(value as number).toLocaleString("id-ID")}`
                  }
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card hoverable className="stat-card">
                <Statistic
                  title={`📈 Profit ${dayjs().format("MMM")}`}
                  value={stats?.totalProfitBulanIni || 0}
                  prefix="Rp "
                  valueStyle={{ color: "#52c41a", fontSize: 16 }}
                  formatter={(value: any) =>
                    `${(value as number).toLocaleString("id-ID")}`
                  }
                />
              </Card>
            </Col>
          </Row>

          {/* Charts Row 1 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={24} lg={12}>
              <FinanceComparison />
            </Col>
            <Col xs={24} lg={12}>
              <PieChartStatus />
            </Col>
          </Row>

          {/* Charts Row 3 - ✅ ADD BAR CHART */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={24}>
              <BarChartRevenue />
            </Col>
          </Row>

          {/* Recent Data Tables */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <ThunderboltFilled style={{ color: "#ff7a45" }} />
                    <span>Kambing Terbaru</span>
                  </Space>
                }
                extra={
                  <Button type="link" onClick={() => push("/kambings")}>
                    Lihat Semua <ArrowRightOutlined />
                  </Button>
                }
              >
                {recentKambings.length > 0 ? (
                  <Table
                    dataSource={recentKambings}
                    columns={[
                      {
                        title: "Nama",
                        dataIndex: "namaKambing",
                        key: "namaKambing",
                        render: (text) => <Text strong>{text}</Text>,
                      },
                      {
                        title: "Umur",
                        dataIndex: "umur",
                        key: "umur",
                        render: (umur) => <span>{umur} bln</span>,
                      },
                      {
                        title: "Harga Beli",
                        dataIndex: "hargaBeli",
                        key: "hargaBeli",
                        render: (harga) => (
                          <Text>Rp {(harga || 0).toLocaleString("id-ID")}</Text>
                        ),
                      },
                      {
                        title: "Harga",
                        dataIndex: "harga",
                        key: "harga",
                        render: (harga) => (
                          <Text>Rp {(harga || 0).toLocaleString("id-ID")}</Text>
                        ),
                      },
                    ]}
                    pagination={false}
                    size="small"
                    rowKey={(record) => record.id_kambing}
                  />
                ) : (
                  <Empty description="Belum ada kambing" />
                )}
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <CodeSandboxOutlined style={{ color: "#52c41a" }} />
                    <span>Material Terbaru</span>
                  </Space>
                }
                extra={
                  <Button type="link" onClick={() => push("/materials")}>
                    Lihat Semua <ArrowRightOutlined />
                  </Button>
                }
              >
                {recentMaterials.length > 0 ? (
                  <Table
                    dataSource={recentMaterials}
                    columns={[
                      {
                        title: "Nama",
                        dataIndex: "namaMaterial",
                        key: "namaMaterial",
                        render: (text) => <Text strong>{text}</Text>,
                      },
                      {
                        title: "Harga Beli",
                        dataIndex: "hargaBeli",
                        key: "hargaBeli",
                        render: (harga) => (
                          <Text>Rp {(harga || 0).toLocaleString("id-ID")}</Text>
                        ),
                      },
                      {
                        title: "Harga Jual",
                        dataIndex: "hargaSatuan",
                        key: "hargaSatuan",
                        render: (harga) => (
                          <Text>Rp {(harga || 0).toLocaleString("id-ID")}</Text>
                        ),
                      },
                    ]}
                    pagination={false}
                    size="small"
                    rowKey={(record) => record.id_material}
                  />
                ) : (
                  <Empty description="Belum ada material" />
                )}
              </Card>
            </Col>
          </Row>

          {/* Recent Orders */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <ShoppingCartOutlined style={{ color: "#faad14" }} />
                    <span>Pesanan Terbaru (Selesai)</span>
                  </Space>
                }
                extra={
                  <Button type="link" onClick={() => push("/orders")}>
                    Lihat Semua <ArrowRightOutlined />
                  </Button>
                }
              >
                {recentOrders.length > 0 ? (
                  <Table
                    dataSource={recentOrders}
                    columns={[
                      {
                        title: "No.",
                        key: "no",
                        width: 50,
                        render: (_text, _record, index) => (
                          <Text strong>#{index + 1}</Text>
                        ),
                      },
                      {
                        title: "Customer",
                        dataIndex: ["user", "fullname"],
                        key: "customer",
                        render: (text) => text || "-",
                      },
                      {
                        title: "Total",
                        dataIndex: "totalHarga",
                        key: "totalHarga",
                        render: (harga) => (
                          <Text strong>Rp {(harga || 0).toLocaleString("id-ID")}</Text>
                        ),
                      },
                      {
                        title: "Tanggal",
                        dataIndex: "tanggalOrder",
                        key: "tanggalOrder",
                        render: (date) =>
                          date ? dayjs(date).format("DD MMM YYYY") : "-",
                      },
                      {
                        title: "Status",
                        dataIndex: "statusPembayaran",
                        key: "statusPembayaran",
                        render: (status) => (
                          <Tag color="green">{status}</Tag>
                        ),
                      },
                    ]}
                    pagination={false}
                    size="small"
                    rowKey={(record) => record.id_order}
                  />
                ) : (
                  <Empty description="Belum ada pesanan bulan ini" />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}

      {isCustomer && (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <CustomerWallet />
          </Col>
        </Row>
      )}

      {!isAdmin && !isCustomer && (
        <Card>
          <Empty description="Role tidak dikenali">
            <Text type="secondary">Silakan login kembali</Text>
          </Empty>
        </Card>
      )}
    </div>
  );
};
