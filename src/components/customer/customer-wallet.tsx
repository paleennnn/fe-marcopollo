"use client";

import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Empty,
  Skeleton,
  Space,
  Button,
  message,
  Tag,
  Alert,
} from "antd";
import {
  DollarOutlined,
  ShoppingOutlined,
  ReloadOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useApiUrl } from "@refinedev/core";
import { useState, useEffect, useCallback, useMemo } from "react";
import Typography from "antd/es/typography";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface CustomerStats {
  totalBelanja: number;
  totalOrder: number;
  totalRefund: number;
  recentOrders: any[];
}

const mockCustomerStats: CustomerStats = {
  totalBelanja: 0,
  totalOrder: 0,
  totalRefund: 0,
  recentOrders: [],
};

export const CustomerWallet = () => {
  const apiUrl = useApiUrl();
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return null;

      const parsed = JSON.parse(userStr);
      const user = parsed.user ? parsed.user : parsed;

      return {
        id: user.id,
        role: user.role,
        name: user.fullname || user.name || "Customer",
      };
    } catch (error) {
      return null;
    }
  };

  // Memoize userInfo untuk menghindari object baru setiap render
  const userInfo = useMemo(() => getUserInfo(), []);
  const isCustomer = userInfo?.role === "customer";

  // Wrap fetchCustomerStats dengan useCallback untuk menghindari infinite loops
  const fetchCustomerStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingMockData(false);

      if (!isCustomer) {
        setStats(mockCustomerStats);
        setUsingMockData(true);
        setLoading(false);
        return;
      }

      if (!apiUrl) {
        throw new Error("API URL tidak tersedia");
      }

      if (!userInfo?.id) {
        throw new Error("User ID tidak tersedia");
      }

      const token = localStorage.getItem("token");
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const endpoints = [
        `${apiUrl}/customer/orders`,
        `${apiUrl}/orders?customer_id=${userInfo?.id}`,
        `${apiUrl}/orders?user_id=${userInfo?.id}`,
        `${apiUrl}/orders`,
      ];

      let success = false;
      let apiData: any = null;
      let totalRefund = 0;

      // 🚀 Parallel fetch dengan timeout protection
      const fetchWithTimeout = (url: string, timeout = 10000) => {
        return Promise.race([
          fetch(url, { credentials: "include", headers }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), timeout)
          ),
        ]);
      };

      const [ordersResult, refundsResult] = await Promise.allSettled([
        // Try all endpoints for orders dengan timeout
        (async () => {
          let lastError = new Error("No endpoints available");
          for (const endpoint of endpoints) {
            try {
              const response = await fetchWithTimeout(endpoint, 8000);
              if ((response as Response).ok) {
                return await (response as Response).json();
              }
            } catch (endpointError) {
              lastError = endpointError as Error;
              continue;
            }
          }
          throw lastError;
        })(),
        // Fetch refunds in parallel dengan timeout
        (async () => {
          try {
            const refundUrl = `${apiUrl}/customer/refunds`;
            const response = await fetchWithTimeout(refundUrl, 8000);
            if ((response as Response).ok) {
              return await (response as Response).json();
            }
          } catch (error) {
            return null;
          }
          return null;
        })(),
      ]);

      // Process orders result
      if (ordersResult.status === "fulfilled" && ordersResult.value) {
        apiData = ordersResult.value;
        success = true;
      } else if (ordersResult.status === "rejected") {
        throw ordersResult.reason;
      }

      // Process refunds result  
      if (refundsResult.status === "fulfilled" && refundsResult.value) {
        const refundData = refundsResult.value;
        const refunds = Array.isArray(refundData)
          ? refundData
          : refundData?.data || [];

        totalRefund = refunds
          .filter((refund: any) => refund.status === "disetujui")
          .reduce((sum: number, refund: any) => {
            const refundAmount = Number(
              refund.totalHarga || refund.total_harga || 0
            );
            return sum + (isNaN(refundAmount) ? 0 : Math.max(refundAmount, 0));
          }, 0);
      }

      if (success && apiData) {
        let orders = [];

        if (Array.isArray(apiData)) {
          orders = apiData;
        } else if (apiData.data && Array.isArray(apiData.data)) {
          orders = apiData.data;
        } else if (apiData.orders && Array.isArray(apiData.orders)) {
          orders = apiData.orders;
        }

        const customerOrders = orders.filter((order: any) => {
          const orderUserId = order.user_id || order.userId || order.id_user;
          return orderUserId == userInfo?.id;
        });

        const completedOrders = customerOrders.filter(
          (order: any) =>
            order.status === "selesai" ||
            order.status_pembayaran === "selesai" ||
            order.statusPembayaran === "selesai" ||
            order.payment_status === "completed"
        );

        const getTotalHarga = (order: any): number => {
          const possibleTotalFields = [
            "total_harga",
            "totalHarga",
            "total_amount",
            "totalAmount",
            "amount",
            "harga_total",
            "total",
            "grand_total",
            "grandTotal",
          ];

          for (const field of possibleTotalFields) {
            const value = order[field];
            if (
              value !== undefined &&
              value !== null &&
              value !== "" &&
              !isNaN(Number(value))
            ) {
              const numValue = Number(value);
              if (numValue > 0) {
                return numValue;
              }
            }
          }

          return 0;
        };

        const totalBelanja = completedOrders.reduce(
          (sum: number, order: any) => {
            const orderTotal = getTotalHarga(order);
            return sum + orderTotal;
          },
          0
        );

        const processedOrders = completedOrders
          .slice(0, 10)
          .map((order: any) => ({
            id_order: order.id_order || order.idOrder || order.id,
            nomor_order:
              order.nomor_order ||
              order.nomorOrder ||
              order.order_number ||
              `INV-${order.id}`,
            total_harga: getTotalHarga(order),
            tanggal_order:
              order.tanggal_order ||
              order.tanggalOrder ||
              order.order_date ||
              order.created_at,
            status:
              order.status ||
              order.status_pembayaran ||
              order.statusPembayaran ||
              "selesai",
            items: order.items || order.order_items || [],
          }));

        const customerStats = {
          totalBelanja: Math.max(totalBelanja, 0),
          totalOrder: Math.max(completedOrders.length, 0),
          totalRefund: Math.max(totalRefund, 0),
          recentOrders: processedOrders,
        };

        setStats(customerStats);
      } else {
        setStats(mockCustomerStats);
        setUsingMockData(true);
        setError("Tidak dapat terhubung ke server. Menampilkan data contoh.");
        message.warning("Koneksi server bermasalah - menampilkan data contoh");
      }
    } catch (error) {
      setStats(mockCustomerStats);
      setUsingMockData(true);
      setError("Terjadi kesalahan sistem. Menampilkan data contoh.");
      message.error("Terjadi kesalahan: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [apiUrl, isCustomer, userInfo?.id]);

  useEffect(() => {
    // Jalan ketika apiUrl berubah atau role berubah
    if (apiUrl && isCustomer !== undefined) {
      fetchCustomerStats();
    }
  }, [apiUrl, isCustomer, fetchCustomerStats]);

  if (!isCustomer && !loading) {
    return (
      <div style={{ padding: "24px 0" }}>
        <Card>
          <Empty
            description="Halaman ini hanya untuk customer"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Text type="secondary">
              Fitur ringkasan belanja hanya tersedia untuk akun customer
            </Text>
          </Empty>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "24px 0" }}>
        <Title level={3}>💰 Ringkasan Belanja Anda</Title>
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} lg={8}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Col>
        </Row>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: "24px 0" }}>
        <Card>
          <Empty
            description="Data ringkasan belanja tidak tersedia"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchCustomerStats}
            >
              Coba Muat Ulang
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <CustomerStatsContent
      stats={stats}
      onRefresh={fetchCustomerStats}
      loading={loading}
      usingMockData={usingMockData}
      error={error}
    />
  );
};

const CustomerStatsContent = ({
  stats,
  onRefresh,
  loading = false,
  usingMockData = false,
  error = null,
}: {
  stats: CustomerStats;
  onRefresh?: () => void;
  loading?: boolean;
  usingMockData?: boolean;
  error?: string | null;
}) => {
  const totalRefund = stats.totalRefund || 0;
  const netSpending = stats.totalBelanja - totalRefund;
  const averageOrder =
    stats.totalOrder > 0 ? Math.round(netSpending / stats.totalOrder) : 0;

  return (
    <div style={{ padding: "24px 0" }}>
      {usingMockData && (
        <Alert
          message="Data Demo"
          description="Sedang menampilkan data contoh untuk demonstrasi. Data real akan tampil ketika terkoneksi dengan server."
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      {error && !usingMockData && (
        <Alert
          message="Koneksi Terputus"
          description={error}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Space direction="vertical" size="small">
            <Title level={3} style={{ margin: 0 }}>
              💰 Ringkasan Belanja Anda
            </Title>
            <Text type="secondary">
              Statistik lengkap semua pesanan yang sudah selesai
            </Text>
          </Space>

          {onRefresh && (
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
              type="primary"
              size="middle"
            >
              Refresh Data
            </Button>
          )}
        </div>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 32, marginTop: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable styles={{ body: { padding: "20px" } }}>
            <Statistic
              title="Total Belanja Bersih"
              value={netSpending}
              prefix={<DollarOutlined />}
              valueStyle={{
                color: netSpending > 0 ? "#1890ff" : "#d9d9d9",
                fontSize: "24px",
              }}
              formatter={(value: any) =>
                `Rp ${(value as number).toLocaleString("id-ID")}`
              }
            />
            <Text
              type="secondary"
              style={{ fontSize: 12, display: "block", marginTop: 8 }}
            >
              Total pengeluaran setelah dikurangi refund
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card hoverable styles={{ body: { padding: "20px" } }}>
            <Statistic
              title="Total Pesanan Selesai"
              value={stats.totalOrder}
              prefix={<ShoppingOutlined />}
              valueStyle={{
                color: stats.totalOrder > 0 ? "#52c41a" : "#d9d9d9",
                fontSize: "24px",
              }}
            />
            <Text
              type="secondary"
              style={{ fontSize: 12, display: "block", marginTop: 8 }}
            >
              Jumlah pesanan yang sudah berhasil diselesaikan
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card hoverable styles={{ body: { padding: "20px" } }}>
            <Statistic
              title="Total Pengembalian Dana"
              value={totalRefund}
              prefix={<DollarOutlined />}
              valueStyle={{
                color: totalRefund > 0 ? "#52c41a" : "#d9d9d9",
                fontSize: "24px",
              }}
              formatter={(value: any) =>
                `Rp ${(value as number).toLocaleString("id-ID")}`
              }
            />
            <Text
              type="secondary"
              style={{ fontSize: 12, display: "block", marginTop: 8 }}
            >
              Total dana yang dikembalikan dari refund
            </Text>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <FileTextOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Riwayat Pesanan Terbaru
            </Title>
            <Tag color={stats.recentOrders.length > 0 ? "blue" : "default"}>
              {stats.recentOrders.length} pesanan
            </Tag>
          </Space>
        }
        extra={
          <Text type="secondary">
            Menampilkan {Math.min(stats.recentOrders.length, 10)} pesanan
            terakhir
          </Text>
        }
      >
        {stats.recentOrders.length > 0 ? (
          <Table
            dataSource={stats.recentOrders}
            columns={[
              {
                title: "No. Order",
                dataIndex: "nomor_order",
                key: "nomor_order",
                render: (text) => (
                  <Text strong style={{ color: "#1890ff" }}>
                    {text}
                  </Text>
                ),
              },
              {
                title: "Total Pembayaran",
                dataIndex: "total_harga",
                key: "total_harga",
                render: (value) => (
                  <Text
                    strong
                    style={{
                      color: value > 0 ? "#52c41a" : "#d9d9d9",
                      fontSize: "14px",
                    }}
                  >
                    Rp {value?.toLocaleString("id-ID")}
                  </Text>
                ),
              },
              {
                title: "Tanggal Pesanan",
                dataIndex: "tanggal_order",
                key: "tanggal_order",
                render: (date) => (
                  <Space direction="vertical" size={0}>
                    <Text strong>{dayjs(date).format("DD MMM YYYY")}</Text>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {dayjs(date).format("HH:mm")}
                    </Text>
                  </Space>
                ),
              },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                render: (status) => (
                  <Tag
                    color={status === "selesai" ? "success" : "processing"}
                    style={{
                      fontWeight: "bold",
                      padding: "4px 8px",
                      borderRadius: "12px",
                    }}
                  >
                    {status === "selesai" ? "✓ Selesai" : status}
                  </Tag>
                ),
              },
            ]}
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
              showTotal: (total, range) =>
                `Menampilkan ${range[0]}-${range[1]} dari ${total} pesanan`,
            }}
            size="middle"
            rowKey="id_order"
            scroll={{ x: 800 }}
          />
        ) : (
          <Empty
            description="Belum ada pesanan yang selesai"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Text type="secondary">
              Pesanan yang sudah selesai akan muncul di sini
            </Text>
          </Empty>
        )}
      </Card>

      <Card size="small" style={{ marginTop: 16, backgroundColor: "#fafafa" }}>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          💡 Data diperbarui secara real-time. Pastikan koneksi internet stabil
          untuk data terbaru.
        </Text>
      </Card>
    </div>
  );
};
