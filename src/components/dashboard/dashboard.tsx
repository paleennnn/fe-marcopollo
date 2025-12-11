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
  ShoppingCartOutlined,
  ArrowRightOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";
import { FinanceComparison } from "@components/finance/finance-comparison";
import { CustomerWallet } from "@components/customer/customer-wallet";
import { PieChartStatus } from "@components/finance/pie-chart-status";
import { BarChartRevenue } from "@components/finance/bar-chart-revenue";
import { useApiUrl, useNavigation, useGetIdentity } from "@refinedev/core";
import { useState, useEffect, useCallback, useMemo } from "react";
import Typography from "antd/es/typography";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// 🔧 CONSTANTS
const PANEN_UMUR = 90;
const PANEN_WARNING_UMUR = 83;
const RECENT_ITEMS_LIMIT = 5;

interface DashboardStats {
  totalKambing: number;
  totalMaterial: number;
  totalCustomer: number;
  totalOrdersBulanIni: number;
  totalRevenueBulanIni: number;
  totalProfitBulanIni: number;
}

interface KolamStatus {
  id_kolam: string;
  nomor_kolam: string;
  ukuran: string;
  jumlah_bibit: number;
  hari_ke: number;
  tanggal_panen: string;
  status: "siap_panen" | "akan_panen" | "budidaya";
}

interface OrderData {
  id_order: string;
  user?: { fullname: string };
  totalHarga: number;
  tanggalOrder: string;
  statusPembayaran: string;
}

// 🔧 UTILITY FUNCTIONS
const getUserRole = (): string | null => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    
    const parsed = JSON.parse(userStr);
    return (parsed.user || parsed).role;
  } catch {
    return null;
  }
};

const formatCurrency = (value: number): string => {
  return `Rp ${value.toLocaleString("id-ID")}`;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    selesai: "green",
    proses: "blue",
    pending: "orange",
    batal: "red",
    siap_panen: "red",
    akan_panen: "orange",
    budidaya: "blue",
  };
  return colors[status] || "default";
};

// 🔧 DATA FETCHING FUNCTIONS
const fetchKolamStatus = async (apiUrl: string, headers: HeadersInit): Promise<KolamStatus[]> => {
  try {
    const response = await fetch(`${apiUrl}/leles`, { headers });
    
    if (!response.ok) return [];
    
    const result = await response.json();
    const kolamsData = Array.isArray(result) ? result : result.data || [];
    
    return kolamsData
      .map((kolam: any): KolamStatus | null => {
        const activeBudidaya = Array.isArray(kolam.budidaya) && kolam.budidaya.length > 0
          ? kolam.budidaya[0]
          : kolam.budidaya;
          
        if (!activeBudidaya) return null;
        
        const startDate = dayjs(
          activeBudidaya.tanggal_mulai || activeBudidaya.tanggalMulai
        );
        
        if (!startDate.isValid()) return null;
        
        const hariKe = dayjs().diff(startDate, "days");
        const panenDate = startDate.add(PANEN_UMUR, "days");
        
        const status: KolamStatus["status"] = 
          hariKe >= PANEN_UMUR ? "siap_panen" :
          hariKe >= PANEN_WARNING_UMUR ? "akan_panen" : "budidaya";
        
        return {
          id_kolam: kolam.id_kolam || kolam.idKolam || "",
          nomor_kolam: kolam.nomor_kolam || kolam.nomorKolam || "",
          ukuran: kolam.ukuran || "",
          jumlah_bibit: activeBudidaya.jumlah_bibit || activeBudidaya.jumlahBibit || 0,
          hari_ke: hariKe,
          tanggal_panen: panenDate.toISOString(),
          status,
        };
      })
      .filter((k: KolamStatus | null): k is KolamStatus => k !== null)
      .sort((a: KolamStatus, b: KolamStatus) => b.hari_ke - a.hari_ke)
      .slice(0, RECENT_ITEMS_LIMIT);
  } catch {
    return [];
  }
};

export const Dashboard = () => {
  const apiUrl = useApiUrl();
  const { push } = useNavigation();
  const { data: identity, isLoading: identityLoading } = useGetIdentity<any>();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderData[]>([]);
  const [kolamStatus, setKolamStatus] = useState<KolamStatus[]>([]);
  const [kolamLoading, setKolamLoading] = useState(false);

  const userRole = useMemo(() => getUserRole(), []);
  const isAdmin = userRole === "admin";
  const isCustomer = userRole === "customer";
  
  const currentMonth = useMemo(() => dayjs().month() + 1, []);
  const currentYear = useMemo(() => dayjs().year(), []);

  const fetchDashboardData = useCallback(async () => {
    if (isCustomer) {
      setStatsLoading(false);
      return;
    }

    try {
      setStatsLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const headers: HeadersInit = { 
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      };

      const fetchPromises = [
        fetch(`${apiUrl}/kambings`, { headers }),
        fetch(`${apiUrl}/materials`, { headers }),
        fetch(`${apiUrl}/users`, { headers }),
        fetch(`${apiUrl}/orders`, { headers }),
        fetch(`${apiUrl}/finance/summary?month=${currentMonth}&year=${currentYear}`, { headers }),
      ];

      const responses = await Promise.all(fetchPromises);
      const [kambingsRes, materialsRes, usersRes, ordersRes, financeRes] = responses;

      // Process all responses with proper error handling
      const parseJson = async (res: Response, endpoint: string, defaultValue: any = null) => {
        try {
          if (!res.ok) {
            console.error(`❌ API Error [${res.status}] ${endpoint}:`, res.statusText);
            const text = await res.text();
            console.error('Response body:', text.substring(0, 200));
            return defaultValue;
          }
          const json = await res.json();
          console.log(`✅ ${endpoint}:`, json);
          return json;
        } catch (err) {
          console.error(`❌ Parse error ${endpoint}:`, err);
          return defaultValue;
        }
      };

      const [kambings, materials, users, orders, finance] = await Promise.all([
        parseJson(kambingsRes, '/kambings', { data: [] }),
        parseJson(materialsRes, '/materials', { data: [] }),
        parseJson(usersRes, '/users', { data: [] }),
        parseJson(ordersRes, '/orders', { data: [] }),
        parseJson(financeRes, '/finance/summary', { data: null }),
      ]);

      // Extract data with type safety - handle both array and nested formats
      const extractArrayData = (response: any): any[] => {
        if (Array.isArray(response)) return response;
        if (response?.data) {
          if (Array.isArray(response.data)) return response.data;
          if (Array.isArray(response.data.data)) return response.data.data;
        }
        return [];
      };

      const kambingsData = extractArrayData(kambings);
      const materialsData = extractArrayData(materials);
      const usersData = extractArrayData(users);
      const ordersData = extractArrayData(orders);

      const allRecentOrders = ordersData
        .map((order): OrderData => ({
          id_order: order.id_order || order.idOrder || "",
          user: order.user || { fullname: "" },
          totalHarga: order.totalHarga || order.total_harga || 0,
          tanggalOrder: order.tanggalOrder || order.tanggal_order || order.created_at || "",
          statusPembayaran: order.statusPembayaran || order.status_pembayaran || "",
        }))
        .sort((a, b) => dayjs(b.tanggalOrder).unix() - dayjs(a.tanggalOrder).unix())
        .slice(0, RECENT_ITEMS_LIMIT);

      const financeData = finance?.data?.ringkasan;

      // Set state
      setStats({
        totalKambing: kambingsData.length,
        totalMaterial: materialsData.length,
        totalCustomer: usersData.filter((u: any) => u.role === "customer").length,
        totalOrdersBulanIni: ordersData.length,
        totalRevenueBulanIni: financeData?.omset?.total ?? 0,
        totalProfitBulanIni: financeData?.profit?.total ?? 0,
      });

      setRecentOrders(allRecentOrders);

      // Fetch kolam status separately
      setKolamLoading(true);
      const kolamData = await fetchKolamStatus(apiUrl, headers);
      setKolamStatus(kolamData);
      setKolamLoading(false);
      setStatsLoading(false);
    } catch (error: any) {
      console.error("Dashboard fetch error:", error);
      setError(error?.message || "Gagal memuat data dashboard");
      setStatsLoading(false);
      setKolamLoading(false);
    }
  }, [apiUrl, currentMonth, currentYear, isCustomer]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 🔧 MEMOIZED VALUES
  const isLoading = useMemo(() => 
    identityLoading || statsLoading, 
    [identityLoading, statsLoading]
  );

  const recentOrdersColumns = useMemo(() => [
    {
      title: "No.",
      key: "no",
      width: 50,
      render: (_text: any, _record: OrderData, index: number) => (
        <Text strong>#{index + 1}</Text>
      ),
    },
    {
      title: "Customer",
      dataIndex: ["user", "fullname"],
      key: "customer",
      render: (text: string) => text || "-",
    },
    {
      title: "Total",
      dataIndex: "totalHarga",
      key: "totalHarga",
      render: (harga: number) => (
        <Text strong>{formatCurrency(harga)}</Text>
      ),
    },
    {
      title: "Tanggal",
      dataIndex: "tanggalOrder",
      key: "tanggalOrder",
      render: (date: string) => date ? dayjs(date).format("DD MMM YYYY") : "-",
    },
    {
      title: "Status",
      dataIndex: "statusPembayaran",
      key: "statusPembayaran",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status || "-"}
        </Tag>
      ),
    },
  ], []);

  const kolamColumns = useMemo(() => [
    {
      title: "No. Kolam",
      dataIndex: "nomor_kolam",
      key: "nomor_kolam",
      render: (text: string) => <Text strong>Kolam {text}</Text>,
    },
    {
      title: "Bibit",
      dataIndex: "jumlah_bibit",
      key: "jumlah_bibit",
      render: (value: number) => `${value.toLocaleString("id-ID")} ekor`,
    },
    {
      title: "Hari Ke-",
      dataIndex: "hari_ke",
      key: "hari_ke",
      align: "center" as const,
      render: (value: number) => (
        <Text strong style={{ color: "#1890ff" }}>
          {value} hari
        </Text>
      ),
    },
    {
      title: "Perkiraan Tanggal Panen",
      dataIndex: "tanggal_panen",
      key: "tanggal_panen",
      render: (date: string) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: KolamStatus["status"]) => (
        <Tag color={getStatusColor(status)} style={{ fontWeight: 600 }}>
          {status === "siap_panen" ? "🔴 SIAP PANEN" : "🟠 AKAN PANEN"}
        </Tag>
      ),
    },
  ], []);

  // 🔧 RENDER FUNCTIONS
  const renderKPICards = useMemo(() => (
    <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
      {[
        { title: "🐐 Total Kambing", value: stats?.totalKambing || 0, suffix: "Ekor", color: "#ff7a45" },
        { title: "📦 Total Material", value: stats?.totalMaterial || 0, suffix: "Produk", color: "#52c41a" },
        { title: "👥 Total Customer", value: stats?.totalCustomer || 0, suffix: "Orang", color: "#1890ff" },
        { title: "🛒 Total Pesanan", value: stats?.totalOrdersBulanIni || 0, suffix: "Order", color: "#faad14" },
        { 
          title: `💰 Omset ${dayjs().format("MMM")}`, 
          value: stats?.totalRevenueBulanIni || 0, 
          prefix: "Rp ", 
          color: "#f5222d",
          formatter: (v: number) => formatCurrency(v)
        },
        { 
          title: `📈 Profit ${dayjs().format("MMM")}`, 
          value: stats?.totalProfitBulanIni || 0, 
          prefix: "Rp ", 
          color: "#52c41a",
          formatter: (v: number) => formatCurrency(v)
        },
      ].map((item, index) => (
        <Col xs={24} sm={12} lg={8} key={index}>
          <Card hoverable>
            <Statistic
              title={item.title}
              value={item.value}
              valueStyle={{ color: item.color }}
              suffix={item.suffix}
              formatter={item.formatter ? (value) => item.formatter!(value as number) : undefined}
            />
          </Card>
        </Col>
      ))}
    </Row>
  ), [stats]);

  // 🔧 LOADING STATE
  if (isLoading) {
    return (
      <Row gutter={[16, 16]}>
        {Array.from({ length: 6 }).map((_, i) => (
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
        onClose={() => setError(null)}
      />
    );
  }

  // 🔧 MAIN RENDER
  return (
    <div style={{ padding: "24px 0" }}>
      {isAdmin && (
        <>
          {/* Header */}
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
            </Row>
          </Card>

          {/* KPI Statistics */}
          {renderKPICards}

          {/* Charts */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={24} lg={12}>
              <FinanceComparison />
            </Col>
            <Col xs={24} lg={12}>
              <PieChartStatus />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={24}>
              <BarChartRevenue />
            </Col>
          </Row>

          {/* Recent Orders */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <ShoppingCartOutlined style={{ color: "#faad14" }} />
                    <span>Pesanan Terbaru</span>
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
                    columns={recentOrdersColumns}
                    pagination={false}
                    size="small"
                    rowKey="id_order"
                  />
                ) : (
                  <Empty description="Belum ada pesanan" />
                )}
              </Card>
            </Col>
          </Row>

          {/* Kolam Status */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <ThunderboltFilled style={{ color: "#ff7a45" }} />
                    <span>Kolam Akan Panen / Siap Panen</span>
                  </Space>
                }
                loading={kolamLoading}
                extra={
                  <Button type="link" onClick={() => push("/leles")}>
                    Kelola Kolam <ArrowRightOutlined />
                  </Button>
                }
              >
                {kolamStatus.length > 0 ? (
                  <Table
                    dataSource={kolamStatus}
                    columns={kolamColumns}
                    pagination={false}
                    size="small"
                    rowKey="id_kolam"
                  />
                ) : (
                  <Empty description="Tidak ada kolam yang akan/siap panen" />
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