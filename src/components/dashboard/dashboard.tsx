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
import { useApiUrl, useNavigation, useGetIdentity, useList } from "@refinedev/core";
import { useState, useEffect, useCallback, useMemo } from "react";
import Typography from "antd/es/typography";
import dayjs from "dayjs";
import { error } from "console";

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

const formatCurrency = (value: number | undefined | null): string => {
  if (!value || value === 0 || isNaN(value)) return `Rp 0`;
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
  const { push } = useNavigation();
  const { data: identity, isLoading: identityLoading } = useGetIdentity<any>();
  
  // Use Refine hooks untuk fetch data - ini jauh lebih reliable
  const { data: kambingsData, isLoading: kambingsLoading } = useList({
    resource: "kambings",
    pagination: { pageSize: 100 },
    queryOptions: { enabled: true },
  });

  const { data: materialsData, isLoading: materialsLoading } = useList({
    resource: "materials",
    pagination: { pageSize: 100 },
    queryOptions: { enabled: true },
  });

  const { data: usersData, isLoading: usersLoading } = useList({
    resource: "users",
    pagination: { pageSize: 100 },
    queryOptions: { enabled: true },
  });

  const { data: ordersData, isLoading: ordersLoading } = useList({
    resource: "orders",
    pagination: { pageSize: 100 },
    queryOptions: { enabled: true },
  });

  const [recentOrders, setRecentOrders] = useState<OrderData[]>([]);
  const [kolamStatus, setKolamStatus] = useState<KolamStatus[]>([]);
  const [kolamLoading, setKolamLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRole = useMemo(() => getUserRole(), []);
  const isAdmin = userRole === "admin";
  const isCustomer = userRole === "customer";
  
  const currentMonth = useMemo(() => dayjs().month() + 1, []);
  const currentYear = useMemo(() => dayjs().year(), []);

  // Hitung stats dari data yang sudah di-fetch oleh hooks
  const stats = useMemo(() => {
    const kambs = kambingsData?.data || [];
    const mats = materialsData?.data || [];
    const uses = usersData?.data || [];
    const ords = ordersData?.data || [];

    // Filter orders bulan ini dengan safe date parsing
    const ordersThisMonth = ords.filter(
      (o: any) => {
        try {
          const orderDate = dayjs(o.tanggalOrder || o.tanggal_order || o.created_at);
          if (!orderDate.isValid()) return false;
          return orderDate.month() + 1 === currentMonth && orderDate.year() === currentYear;
        } catch {
          return false;
        }
      }
    );

    return {
      totalKambing: kambs.length || 0,
      totalMaterial: mats.length || 0,
      totalCustomer: uses.filter((u: any) => u.role === "customer").length || 0,
      totalOrdersBulanIni: ordersThisMonth.length || 0,
      totalRevenueBulanIni: ordersThisMonth
        .reduce((sum: number, o: any) => sum + (o.totalHarga || o.total_harga || 0), 0) || 0,
      totalProfitBulanIni: 0,
    };
  }, [kambingsData?.data, materialsData?.data, usersData?.data, ordersData?.data, currentMonth, currentYear]);

  // Fetch kolam status
  useEffect(() => {
    const fetchKolamStatus = async () => {
      try {
        setKolamLoading(true);
        const token = localStorage.getItem("token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        const response = await fetch(`http://localhost:3333/api/leles`, { headers });
        if (!response.ok) throw new Error("Failed to fetch kolam");
        
        const json = await response.json();
        const kolamData = Array.isArray(json) ? json : json?.data || [];
        
        // Filter hanya kolam yang akan/siap panen (status bukan "budidaya")
        const PANEN_UMUR = 90;
        const PANEN_WARNING_UMUR = 83;
        
        const filteredKolam = kolamData
          .map((kolam: any) => {
            const activeStatus = kolam.status === "sedang_budidaya" ? kolam.budidaya : kolam.budidaya;
            if (!activeStatus) return null;

            const startDate = dayjs(activeStatus.tanggal_mulai || activeStatus.tanggalMulai);
            if (!startDate.isValid()) return null;

            const hariKe = dayjs().diff(startDate, "days");
            const panenDate = startDate.add(PANEN_UMUR, "days");

            const status: "siap_panen" | "akan_panen" | "budidaya" =
              hariKe >= PANEN_UMUR ? "siap_panen" :
              hariKe >= PANEN_WARNING_UMUR ? "akan_panen" : "budidaya";

            // Hanya tampilkan yang akan/siap panen
            if (status === "budidaya") return null;

            return {
              id_kolam: kolam.id_kolam || kolam.idKolam || "",
              nomor_kolam: kolam.nomor_kolam || kolam.nomorKolam || "",
              ukuran: kolam.ukuran || "",
              jumlah_bibit: activeStatus.jumlah_bibit || activeStatus.jumlahBibit || 0,
              hari_ke: hariKe,
              tanggal_panen: panenDate.toISOString(),
              status,
            };
          })
          .filter((k: any) => k !== null)
          .sort((a: any, b: any) => b.hari_ke - a.hari_ke)
          .slice(0, 5);
        
        setKolamStatus(filteredKolam);
      } catch (err) {
        console.error("Error fetching kolam status:", err);
        setKolamStatus([]);
      } finally {
        setKolamLoading(false);
      }
    };

    if (isAdmin) fetchKolamStatus();
  }, [isAdmin]);

  // Extract recent orders
  useEffect(() => {
    if (ordersData?.data) {
      const recent = (ordersData.data as OrderData[])
        .sort(
          (a, b) =>
            new Date(b.tanggalOrder).getTime() - new Date(a.tanggalOrder).getTime()
        )
        .slice(0, RECENT_ITEMS_LIMIT);
      setRecentOrders(recent);
    }
  }, [ordersData?.data]);
  // 🔧 MEMOIZED VALUES
  const isLoading = useMemo(() => 
    identityLoading || kambingsLoading || materialsLoading || usersLoading || ordersLoading, 
    [identityLoading, kambingsLoading, materialsLoading, usersLoading, ordersLoading]
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
      render: (value: number) => value ? `${value.toLocaleString("id-ID")} ekor` : "0 ekor",
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