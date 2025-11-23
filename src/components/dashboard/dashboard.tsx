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
} from "antd";
import {
  ShoppingOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  ThunderboltFilled,
  CodeSandboxOutlined,
} from "@ant-design/icons";
import { FinanceComparison } from "@components/finance/finance-comparison";
import { CustomerWallet } from "@components/customer/customer-wallet";
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

  // ✅ FUNCTION UNTUK GET USER ROLE DARI LOCALSTORAGE
  const getUserRole = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return null;

      const parsed = JSON.parse(userStr);
      const user = parsed.user ? parsed.user : parsed;
      return user.role;
    } catch {
      return null;
    }
  };

  const userRole = getUserRole();
  const isAdmin = userRole === "admin";
  const isCustomer = userRole === "customer";

  // Fetch stats - HANYA UNTUK ADMIN
  useEffect(() => {
    const fetchStats = async () => {
      // ✅ JIKA CUSTOMER, SKIP FETCH STATS ADMIN
      if (isCustomer) {
        console.log("👥 Customer detected, skipping admin stats fetch");
        setStatsLoading(false);
        return;
      }

      try {
        setStatsLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        console.log("🔄 Fetching dashboard stats for admin...");

        // Fetch semua data yang dibutuhkan
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

        console.log("Response statuses:", {
          kambings: kambingsRes.status,
          materials: materialsRes.status,
          users: usersRes.status,
          orders: ordersRes.status,
          finance: financeRes.status,
        });

        const kambings = await kambingsRes.json();
        const materials = await materialsRes.json();
        const users = await usersRes.json();
        const orders = await ordersRes.json();
        const finance = financeRes.ok
          ? await financeRes.json()
          : { data: null };

        console.log("📊 Finance response:", finance);
        console.log("📋 Raw orders response:", orders);

        // Handle responses
        const kambingsData = Array.isArray(kambings)
          ? kambings
          : kambings.data || [];
        const materialsData = Array.isArray(materials)
          ? materials
          : materials.data || [];
        const usersData = Array.isArray(users) ? users : users.data || [];

        // FIX: AdonisJS orders response format
        let ordersData: any[] = [];
        if (Array.isArray(orders)) {
          ordersData = orders;
        } else if (orders?.data?.data && Array.isArray(orders.data.data)) {
          ordersData = orders.data.data;
        } else if (orders?.data && Array.isArray(orders.data)) {
          ordersData = orders.data;
        } else if (orders?.message && orders?.data?.data) {
          ordersData = orders.data.data || [];
        }

        console.log("✅ Processed orders:", ordersData);

        // Filter orders bulan ini yang selesai
        const ordersThisMonth = ordersData.filter((order: any) => {
          // Support berbagai format field name
          const orderDate =
            order.tanggalVerifikasi || order.tanggal_verifikasi
              ? dayjs(order.tanggalVerifikasi || order.tanggal_verifikasi)
              : dayjs(
                  order.tanggalOrder || order.tanggal_order || order.created_at
                );

          const status =
            order.statusPembayaran || order.status_pembayaran || order.status;
          const isThisMonth =
            orderDate.month() + 1 === currentMonth &&
            orderDate.year() === currentYear;
          const isCompleted = status === "selesai";

          console.log(`Order ${order.idOrder || order.id}:`, {
            date: orderDate.format("YYYY-MM-DD"),
            status,
            isThisMonth,
            isCompleted,
          });

          return isThisMonth && isCompleted;
        });

        console.log("✅ Orders this month:", ordersThisMonth);

        // Finance data
        const financeData = finance?.data?.ringkasan;
        console.log("💰 Finance data:", financeData);

        const totalProfit = financeData?.profit?.total ?? 0;
        const totalRevenue = financeData?.omset?.total ?? 0;

        setStats({
          totalKambing: kambingsData?.length || 0,
          totalMaterial: materialsData?.length || 0,
          totalCustomer:
            usersData?.filter((u: any) => u.role === "customer").length || 0,
          totalOrdersBulanIni: ordersThisMonth.length,
          totalRevenueBulanIni: totalRevenue,
          totalProfitBulanIni: totalProfit,
        });

        // Set recent data
        setRecentKambings(kambingsData?.slice(0, 5) || []);
        setRecentMaterials(materialsData?.slice(0, 5) || []);
        setRecentOrders(ordersThisMonth.slice(0, 5) || []);

        console.log("✅ Dashboard data loaded successfully");
        setStatsLoading(false);
      } catch (error: any) {
        console.error("❌ Failed to fetch dashboard stats:", error);
        setError(error?.message || "Gagal memuat data dashboard");
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [apiUrl, currentMonth, currentYear, isCustomer]);

  // ⚠️ LOADING STATE
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

  // Show error alert jika ada
  if (error) {
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

  // ✅ RENDER BERDASARKAN ROLE
  return (
    <div style={{ padding: "24px 0" }}>
      {/* 🛡️ TAMPILAN UNTUK ADMIN */}
      {isAdmin && (
        <>
          {/* Stats Cards - HANYA UNTUK ADMIN */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={12} lg={8}>
              <Card hoverable>
                <Statistic
                  title="Total Kambing"
                  value={stats?.totalKambing || 0}
                  prefix={<ThunderboltFilled />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card hoverable>
                <Statistic
                  title="Total Material"
                  value={stats?.totalMaterial || 0}
                  prefix={<CodeSandboxOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card hoverable>
                <Statistic
                  title="Total Customer"
                  value={stats?.totalCustomer || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card hoverable>
                <Statistic
                  title={`Pesanan (${dayjs().format("MMM YYYY")})`}
                  value={stats?.totalOrdersBulanIni || 0}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: "#eb2f96" }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card hoverable>
                <Statistic
                  title={`Revenue (${dayjs().format("MMM YYYY")})`}
                  value={stats?.totalRevenueBulanIni || 0}
                  prefix={<DollarOutlined />}
                  suffix="Rp"
                  valueStyle={{ color: "#f5222d", fontSize: "16px" }}
                  formatter={(value: any) =>
                    `${(value as number).toLocaleString("id-ID")}`
                  }
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card hoverable>
                <Statistic
                  title={`Profit (${dayjs().format("MMM YYYY")})`}
                  value={stats?.totalProfitBulanIni || 0}
                  prefix={<DollarOutlined />}
                  suffix="Rp"
                  valueStyle={{ color: "#52c41a", fontSize: "16px" }}
                  formatter={(value: any) =>
                    `${(value as number).toLocaleString("id-ID")}`
                  }
                />
              </Card>
            </Col>
          </Row>

          {/* 📈 Finance Trend - HANYA UNTUK ADMIN */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32, marginTop: 32 }}>
            <Col xs={24}>
              <FinanceComparison />
            </Col>
          </Row>

          {/* 📋 Recent Data Tables - HANYA UNTUK ADMIN */}
          <Row gutter={[16, 16]}>
            {/* Recent Kambings */}
            <Col xs={24} lg={12}>
              <Card
                title={<Title level={4}>🐐 Kambing Terbaru</Title>}
                extra={
                  <Button type="link" onClick={() => push("/kambings")}>
                    Lihat Semua <ArrowRightOutlined />
                  </Button>
                }
                loading={false}
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
                        render: (umur) => <span>{umur} bulan</span>,
                      },
                      {
                        title: "Harga",
                        dataIndex: "harga",
                        key: "harga",
                        render: (harga) => (
                          <Text>Rp {harga?.toLocaleString("id-ID")}</Text>
                        ),
                      },
                    ]}
                    pagination={false}
                    size="small"
                    rowKey={(record) => record.id_kambing || record.id}
                  />
                ) : (
                  <Empty description="Belum ada kambing" />
                )}
              </Card>
            </Col>

            {/* Recent Materials */}
            <Col xs={24} lg={12}>
              <Card
                title={<Title level={4}>📦 Material Terbaru</Title>}
                extra={
                  <Button type="link" onClick={() => push("/materials")}>
                    Lihat Semua <ArrowRightOutlined />
                  </Button>
                }
                loading={false}
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
                          <Text>Rp {harga?.toLocaleString("id-ID")}</Text>
                        ),
                      },
                      {
                        title: "Harga Jual",
                        dataIndex: "hargaSatuan",
                        key: "hargaSatuan",
                        render: (harga) => (
                          <Text>Rp {harga?.toLocaleString("id-ID")}</Text>
                        ),
                      },
                    ]}
                    pagination={false}
                    size="small"
                    rowKey={(record) => record.id_material || record.id}
                  />
                ) : (
                  <Empty description="Belum ada material" />
                )}
              </Card>
            </Col>

            {/* Recent Orders */}
            <Col xs={24}>
              <Card
                title={<Title level={4}>🛒 Pesanan Terbaru (Selesai)</Title>}
                extra={
                  <Button type="link" onClick={() => push("/orders")}>
                    Lihat Semua <ArrowRightOutlined />
                  </Button>
                }
                loading={false}
              >
                {recentOrders.length > 0 ? (
                  <Table
                    dataSource={recentOrders}
                    columns={[
                      {
                        title: "No. Order",
                        key: "no",
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
                          <Text>Rp {(harga || 0).toLocaleString("id-ID")}</Text>
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
                        render: (status) => {
                          const colors: Record<string, string> = {
                            selesai: "green",
                            menunggu_verifikasi: "orange",
                            ditolak: "red",
                          };
                          return (
                            <Tag color={colors[status] || "blue"}>{status}</Tag>
                          );
                        },
                      },
                    ]}
                    pagination={false}
                    size="small"
                    rowKey={(record) => record.idOrder || record.id}
                  />
                ) : (
                  <Empty description="Belum ada pesanan bulan ini" />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* 👥 TAMPILAN UNTUK CUSTOMER */}
      {isCustomer && (
        <Row gutter={[16, 16]} style={{ marginBottom: 32, marginTop: 32 }}>
          <Col xs={24}>
            <CustomerWallet />
          </Col>
        </Row>
      )}

      {/* ❌ JIKA ROLE TIDAK DIKENALI */}
      {!isAdmin && !isCustomer && (
        <Card>
          <Empty
            description="Role pengguna tidak dikenali"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Text type="secondary">
              Silakan login kembali atau hubungi administrator
            </Text>
          </Empty>
        </Card>
      )}
    </div>
  );
};
