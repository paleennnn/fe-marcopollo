"use client";

import { Card, Col, Row, Statistic, Table, Empty, Skeleton, Space, Button, message, Tag, Alert } from "antd";
import { DollarOutlined, ShoppingOutlined, ReloadOutlined, FileTextOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useApiUrl, useNavigation } from "@refinedev/core";
import { useState, useEffect } from "react";
import Typography from "antd/es/typography";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface CustomerStats {
  totalBelanja: number;
  totalOrder: number;
  recentOrders: any[];
}

// ✅ MOCK DATA YANG LEBIH REALISTIS
const mockCustomerStats: CustomerStats = {
  totalBelanja: 12500000,
  totalOrder: 5,
  recentOrders: [
    {
      id_order: "ORD-2025-001",
      nomor_order: "INV-2025-001",
      total_harga: 3200000,
      tanggal_order: "2025-01-20T14:30:00Z",
      status: "selesai",
      items: ["Kambing C", "Batu Bata 1000pcs"]
    },
    {
      id_order: "ORD-2025-002", 
      nomor_order: "INV-2025-002",
      total_harga: 1800000,
      tanggal_order: "2025-01-15T11:20:00Z",
      status: "selesai",
      items: ["Kambing D", "Pasir Hitam"]
    },
    {
      id_order: "ORD-2025-003",
      nomor_order: "INV-2025-003",
      total_harga: 4500000,
      tanggal_order: "2025-01-10T09:45:00Z",
      status: "selesai",
      items: ["Kambing E", "Batu Bata 2000pcs"]
    }
  ]
};

export const CustomerWallet = () => {
  const apiUrl = useApiUrl();
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  // ✅ FUNCTION UNTUK GET USER INFO
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem("user");
      console.log("📝 Raw user data from localStorage:", userStr);
      
      if (!userStr) {
        console.log("❌ No user data found in localStorage");
        return null;
      }

      const parsed = JSON.parse(userStr);
      console.log("📝 Parsed user data:", parsed);
      
      const user = parsed.user ? parsed.user : parsed;
      const userInfo = {
        id: user.id,
        role: user.role,
        name: user.fullname || user.name || 'Customer'
      };
      
      console.log("👤 Extracted user info:", userInfo);
      return userInfo;
    } catch (error) {
      console.error("❌ Error parsing user data:", error);
      return null;
    }
  };

  const userInfo = getUserInfo();
  const isCustomer = userInfo?.role === "customer";

  console.log("🎯 Final check - Is Customer:", isCustomer);
  console.log("🎯 User ID:", userInfo?.id);

  const fetchCustomerStats = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingMockData(false);
      
      console.log("🔄 Starting to fetch customer stats...");
      console.log("🔗 API URL:", apiUrl);
      console.log("👤 User Info:", userInfo);

      // ✅ JIKA BUKAN CUSTOMER, LANGSUNG PAKAI MOCK DATA
      if (!isCustomer) {
        console.log("🛑 Not a customer, using mock data directly");
        setStats(mockCustomerStats);
        setUsingMockData(true);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      console.log("🔑 Token available:", !!token);

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // ✅ COBA BEBERAPA ENDPOINT YANG MUNGKIN
      const endpoints = [
        `${apiUrl}/customer/orders`,
        `${apiUrl}/orders?customer_id=${userInfo?.id}`,
        `${apiUrl}/orders?user_id=${userInfo?.id}`,
        `${apiUrl}/orders`,
      ];

      let success = false;
      let apiData: any = null;

      // ✅ COBA SETIAP ENDPOINT
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            credentials: "include",
            headers,
          });

          console.log(`📡 Response status for ${endpoint}:`, response.status);

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Success with endpoint ${endpoint}:`, data);
            apiData = data;
            success = true;
            break;
          } else {
            console.warn(`❌ Endpoint ${endpoint} failed with status:`, response.status);
          }
        } catch (endpointError) {
          console.error(`❌ Error with endpoint ${endpoint}:`, endpointError);
        }
      }

      if (success && apiData) {
        console.log("✅ API call successful, processing data...");
        
        // ✅ PROCESS DATA DARI BERBAGAI FORMAT RESPONSE
        let orders = [];
        
        if (Array.isArray(apiData)) {
          orders = apiData;
        } else if (apiData.data && Array.isArray(apiData.data)) {
          orders = apiData.data;
        } else if (apiData.orders && Array.isArray(apiData.orders)) {
          orders = apiData.orders;
        } else {
          orders = [];
        }

        console.log("📦 Raw orders from API:", orders);

        // ✅ FILTER UNTUK CUSTOMER YANG SEDANG LOGIN
        const customerOrders = orders.filter((order: any) => {
          const orderUserId = order.user_id || order.userId || order.id_user;
          const isCustomerOrder = orderUserId == userInfo?.id; // Use == for loose comparison
          console.log(`Order ${order.id}: user_id=${orderUserId}, current_user=${userInfo?.id}, match=${isCustomerOrder}`);
          return isCustomerOrder;
        });

        console.log("👤 Customer-specific orders:", customerOrders);

        const completedOrders = customerOrders.filter(
          (order: any) => 
            order.status === "selesai" || 
            order.status_pembayaran === "selesai" ||
            order.statusPembayaran === "selesai" ||
            order.payment_status === "completed"
        );

        console.log("✅ Completed orders:", completedOrders);

        // ✅ PERBAIKAN: CARI FIELD TOTAL_HARGA YANG SESUAI
        const totalBelanja = completedOrders.reduce(
          (sum: number, order: any) => {
            // Coba berbagai kemungkinan field name untuk total harga
            const possibleTotalFields = [
              'total_harga', 'totalHarga', 'total_amount', 'totalAmount', 
              'amount', 'harga_total', 'total', 'grand_total', 'grandTotal'
            ];
            
            let orderTotal = 0;
            for (const field of possibleTotalFields) {
              if (order[field] !== undefined && order[field] !== null) {
                orderTotal = order[field];
                console.log(`💰 Found total in field '${field}':`, orderTotal);
                break;
              }
            }
            
            // Jika tidak ditemukan, log untuk debugging
            if (orderTotal === 0) {
              console.log('🔍 Order fields for total search:', Object.keys(order));
              console.log('❌ No total field found in order:', order);
            }
            
            return sum + orderTotal;
          },
          0
        );

        console.log("💰 Calculated totalBelanja:", totalBelanja);

        const processedOrders = completedOrders.slice(0, 10).map((order: any) => {
          // Cari field total_harga yang sesuai untuk setiap order
          const possibleTotalFields = [
            'total_harga', 'totalHarga', 'total_amount', 'totalAmount', 
            'amount', 'harga_total', 'total', 'grand_total', 'grandTotal'
          ];
          
          let orderTotal = 0;
          for (const field of possibleTotalFields) {
            if (order[field] !== undefined && order[field] !== null) {
              orderTotal = order[field];
              break;
            }
          }

          return {
            id_order: order.id_order || order.idOrder || order.id,
            nomor_order: order.nomor_order || order.nomorOrder || order.order_number || `INV-${order.id}`,
            total_harga: orderTotal, // Gunakan nilai yang sudah ditemukan
            tanggal_order: order.tanggal_order || order.tanggalOrder || order.order_date || order.created_at,
            status: order.status || order.status_pembayaran || order.statusPembayaran || 'selesai',
            items: order.items || order.order_items || []
          };
        });

        const customerStats = {
          totalBelanja,
          totalOrder: completedOrders.length,
          recentOrders: processedOrders,
        };

        console.log("📊 Final customer stats:", customerStats);
        setStats(customerStats);
        
      } else {
        // ✅ FALLBACK KE MOCK DATA JIKA SEMUA ENDPOINT GAGAL
        console.warn("❌ All API endpoints failed, using mock data");
        setStats(mockCustomerStats);
        setUsingMockData(true);
        setError("Tidak dapat terhubung ke server. Menampilkan data contoh.");
        message.info("Menggunakan data contoh untuk demo");
      }

    } catch (error) {
      console.error("❌ Critical error in fetchCustomerStats:", error);
      // ✅ FALLBACK KE MOCK DATA JIKA ADA ERROR
      setStats(mockCustomerStats);
      setUsingMockData(true);
      setError("Terjadi kesalahan sistem. Menampilkan data contoh.");
      message.info("Menggunakan data contoh untuk demo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🎬 CustomerWallet component mounted");
    fetchCustomerStats();
  }, [apiUrl, isCustomer]);

  // ✅ JIKA BUKAN CUSTOMER, TAMPILKAN PESAN
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

  // ✅ LOADING STATE
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

  // ✅ JIKA TIDAK ADA STATS SETELAH LOADING
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

// ✅ COMPONENT TERPISAH UNTUK KONTEN STATS
const CustomerStatsContent = ({ 
  stats, 
  onRefresh, 
  loading = false,
  usingMockData = false,
  error = null
}: { 
  stats: CustomerStats; 
  onRefresh?: () => void;
  loading?: boolean;
  usingMockData?: boolean;
  error?: string | null;
}) => {
  
  const averageOrder = stats.totalOrder > 0 ? Math.round(stats.totalBelanja / stats.totalOrder) : 0;

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Alert untuk mock data */}
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

      {/* Error Alert */}
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

      {/* Header Section */}
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Space direction="vertical" size="small">
            <Title level={3} style={{ margin: 0 }}>💰 Ringkasan Belanja Anda</Title>
            <Text type="secondary">
              Statistik lengkap semua pesanan yang sudah selesai
            </Text>
          </Space>
          
          {/* Refresh Button */}
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

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32, marginTop: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card 
            hoverable 
            styles={{ body: { padding: '20px' } }}
          >
            <Statistic
              title="Total Belanja"
              value={stats.totalBelanja}
              prefix={<DollarOutlined />}
              valueStyle={{ 
                color: stats.totalBelanja > 0 ? "#1890ff" : "#d9d9d9", 
                fontSize: '24px' 
              }}
              formatter={(value: any) => `Rp ${(value as number).toLocaleString("id-ID")}`}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              Total pengeluaran dari semua pesanan selesai
            </Text>
            {stats.totalBelanja === 0 && (
              <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 4, color: '#ff4d4f' }}>
                Field total_harga tidak ditemukan di data order
              </Text>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card 
            hoverable 
            styles={{ body: { padding: '20px' } }}
          >
            <Statistic
              title="Total Pesanan Selesai"
              value={stats.totalOrder}
              prefix={<ShoppingOutlined />}
              valueStyle={{ 
                color: stats.totalOrder > 0 ? "#52c41a" : "#d9d9d9", 
                fontSize: '24px' 
              }}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              Jumlah pesanan yang sudah berhasil diselesaikan
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card 
            hoverable 
            styles={{ body: { padding: '20px' } }}
          >
            <Statistic
              title="Rata-rata per Pesanan"
              value={averageOrder}
              prefix={<DollarOutlined />}
              suffix="Rp"
              valueStyle={{ 
                color: averageOrder > 0 ? "#faad14" : "#d9d9d9", 
                fontSize: '24px' 
              }}
              formatter={(value: any) => `${(value as number).toLocaleString("id-ID")}`}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              Rata-rata nilai setiap pesanan
            </Text>
            {averageOrder === 0 && stats.totalOrder > 0 && (
              <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 4, color: '#ff4d4f' }}>
                Tidak dapat menghitung: total_harga = 0
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card 
        title={
          <Space>
            <FileTextOutlined />
            <Title level={4} style={{ margin: 0 }}>Riwayat Pesanan Terbaru</Title>
            <Tag color={stats.recentOrders.length > 0 ? "blue" : "default"}>
              {stats.recentOrders.length} pesanan
            </Tag>
          </Space>
        }
        extra={
          <Text type="secondary">
            Menampilkan {Math.min(stats.recentOrders.length, 10)} pesanan terakhir
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
                render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>,
                width: 150,
              },
              {
                title: "Total Pembayaran",
                dataIndex: "total_harga",
                key: "total_harga",
                render: (value) => (
                  <Text strong style={{ 
                    color: value > 0 ? '#52c41a' : '#d9d9d9', 
                    fontSize: '14px' 
                  }}>
                    Rp {value?.toLocaleString("id-ID")}
                  </Text>
                ),
                width: 150,
                align: 'right' as const,
              },
              {
                title: "Tanggal Pesanan",
                dataIndex: "tanggal_order",
                key: "tanggal_order",
                render: (date) => (
                  <Space direction="vertical" size={0}>
                    <Text strong>{dayjs(date).format("DD MMM YYYY")}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(date).format("HH:mm")}
                    </Text>
                  </Space>
                ),
                width: 140,
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
                      borderRadius: "12px"
                    }}
                  >
                    {status === "selesai" ? "✓ Selesai" : status}
                  </Tag>
                ),
                width: 100,
                align: 'center' as const,
              },
            ]}
            pagination={{ 
              pageSize: 5,
              showSizeChanger: false,
              showTotal: (total, range) => 
                `Menampilkan ${range[0]}-${range[1]} dari ${total} pesanan`
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
            {usingMockData && (
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                (Data demo: Tidak ada pesanan dalam contoh data)
              </Text>
            )}
          </Empty>
        )}
      </Card>

      {/* Info Footer */}
      <Card size="small" style={{ marginTop: 16, backgroundColor: '#fafafa' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {usingMockData ? (
            "💡 Sedang menampilkan data contoh. Pastikan backend API tersedia untuk data real."
          ) : (
            "💡 Data diperbarui secara real-time. Pastikan koneksi internet stabil untuk data terbaru."
          )}
        </Text>
      </Card>
    </div>
  );
};