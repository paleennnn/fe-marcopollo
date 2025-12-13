"use client";

import React, { useState, useEffect } from "react";
import { useShow, useApiUrl, CanAccess, useCustomMutation, useCustom } from "@refinedev/core";
import { Show, DateField } from "@refinedev/antd";
import {
  Typography,
  Card,
  Row,
  Col,
  Descriptions,
  Image,
  Skeleton,
  Tag,
  Button,
  Space,
  InputNumber,
} from "antd";
import {
  AppstoreOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNotification } from "@refinedev/core";
import UnauthorizedPage from "@app/unauthorized";

const { Title, Text } = Typography;

export const KambingShow = () => {
  const { query } = useShow();
  const { data, isLoading, isError } = query;
  const record = data?.data;
  const apiUrl = useApiUrl();
  const { open } = useNotification();

  const [quantity] = useState(1);
  const [loadingAddToCart, setLoadingAddToCart] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const { mutate: addToCart } = useCustomMutation();

  // Fetch data keranjang untuk mendapatkan kambing yang sudah ada di keranjang user ini
  const { data: cartData, isLoading: cartLoading, refetch: refetchCart } = useCustom({
    url: `${apiUrl}/customer/keranjang`,
    method: 'get',
  })

  // Update isInCart setiap kali cartData berubah
  useEffect(() => {
    if (cartData?.data?.data && record?.idKambing) {
      const apiData = cartData.data.data
      
      const isKambingInCart = apiData.some(
        (item: any) => item.idKambing === record.idKambing
      )
      setIsInCart(isKambingInCart)
    }
  }, [cartData, record?.idKambing])

  // Cek role user
  const getUserRole = () => {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      const parsed = JSON.parse(userStr);
      const user = parsed.user ? parsed.user : parsed;
      return user.role;
    } catch {
      return null;
    }
  };

  const userRole = getUserRole();
  const isAdmin = userRole === "admin";

  const calculateMargin = () => {
    if (!record?.hargaBeli || !record?.harga) return 0;
    const profit = record.harga - record.hargaBeli;
    const margin = (profit / record.hargaBeli) * 100;
    return margin.toFixed(2);
  };

  const renderImage = () => {
    if (!record?.image) {
      return <Text type="secondary">Tidak ada foto</Text>;
    }

    const imageUrl =
      apiUrl.endsWith("/") && record.image.startsWith("/")
        ? `${apiUrl}${record.image.substring(1)}`
        : !apiUrl.endsWith("/") && !record.image.startsWith("/")
        ? `${apiUrl}/${record.image}`
        : `${apiUrl}${record.image}`;

    return (
      <Image
        src={imageUrl}
        alt={record.namaKambing}
        style={{ maxWidth: "100%", borderRadius: "8px" }}
      />
    );
  };

  const handleAddToCart = () => {
    // Cek apakah kambing sudah ada di keranjang
    if (isInCart) {
      open?.({
        type: 'error',
        message: 'Peringatan',
        description: 'Kambing ini sudah ada di keranjang Anda',
      })
      return
    }

    if (!record?.idKambing) {
      return
    }

    setLoadingAddToCart(true);
    addToCart(
      {
        url: `${apiUrl}/customer/keranjang`,
        method: "post",
        values: {
          tipe_produk: "kambing",
          id_produk: record.idKambing,
          jumlah: 1,
        },
      },
      {
        onSuccess: () => {
          open?.({
            type: "success",
            message: "Berhasil",
            description: "Kambing berhasil ditambahkan ke keranjang",
          });
          setLoadingAddToCart(false);
          // Refetch cart untuk update status
          refetchCart()
        },
        onError: (error: any) => {
          open?.({
            type: "error",
            message: "Gagal",
            description:
              error?.message || "Gagal menambahkan kambing ke keranjang",
          });
          setLoadingAddToCart(false);
        },
      }
    );
  };

  if (query.error && query.error.statusCode === 403) {
    return <UnauthorizedPage />;
  }

  if (isLoading) {
    return (
      <Show
        title={
          <Text>
            <AppstoreOutlined /> Loading...
          </Text>
        }
      >
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </Show>
    );
  }

  if (isError) {
    return (
      <Card>
        <Title level={4} type="danger">
          Error
        </Title>
        <Text>Gagal memuat detail kambing.</Text>
      </Card>
    );
  }

  // ========== TAMPILAN ADMIN ==========
  if (isAdmin) {
    return (
      <CanAccess
        resource="kambings"
        action="show"
        fallback={<UnauthorizedPage />}
      >
        <Show
          title={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AppstoreOutlined style={{ fontSize: 22, color: "#1890ff" }} />
              <Title level={4} style={{ margin: 0 }}>
                Detail Kambing
              </Title>
            </span>
          }
        >
          <Row gutter={[16, 16]}>
            {/* Informasi Kambing */}
            <Col xs={24} lg={16}>
              <Card title="Informasi Kambing" bordered={false}>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Nama Kambing">
                    {record?.namaKambing ?? "-"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Umur">
                    {record?.umur ? `${record.umur} bulan` : "-"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Harga Beli">
                    <Text strong style={{ color: "#f5222d" }}>
                      Rp {record?.hargaBeli?.toLocaleString("id-ID") ?? "-"}
                    </Text>
                  </Descriptions.Item>

                  <Descriptions.Item label="Harga Jual">
                    <Text strong style={{ color: "#52c41a" }}>
                      Rp {record?.harga?.toLocaleString("id-ID") ?? "-"}
                    </Text>
                  </Descriptions.Item>

                  <Descriptions.Item label="Margin Keuntungan">
                    {record?.hargaBeli && record?.harga ? (
                      <>
                        <Tag color="blue">{calculateMargin()}%</Tag>
                        <Text style={{ marginLeft: 8 }}>
                          (Rp {(record.harga - record.hargaBeli).toLocaleString("id-ID")})
                        </Text>
                      </>
                    ) : (
                      "-"
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Keterangan">
                    {record?.keterangan ?? "-"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Catatan">
                    {record?.catatan ?? "-"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Tanggal Ditambahkan">
                    <CalendarOutlined />{" "}
                    {record?.tanggalDitambahkan ? (
                      <DateField
                        value={record.tanggalDitambahkan}
                        format="DD MMM YYYY"
                      />
                    ) : (
                      "-"
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Tanggal Dibuat">
                    <CalendarOutlined />{" "}
                    {record?.createdAt ? (
                      <DateField
                        value={record.createdAt}
                        format="DD MMM YYYY HH:mm"
                      />
                    ) : (
                      "-"
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Terakhir Diperbarui">
                    <CalendarOutlined />{" "}
                    {record?.updatedAt ? (
                      <DateField
                        value={record.updatedAt}
                        format="DD MMM YYYY HH:mm"
                      />
                    ) : (
                      "-"
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {/* Foto */}
            <Col xs={24} lg={8}>
              <Card title="Foto Kambing" bordered={false}>
                {renderImage()}
              </Card>
            </Col>
          </Row>
        </Show>
      </CanAccess>
    );
  }

  // ========== TAMPILAN CUSTOMER ==========
  return (
    <Show
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AppstoreOutlined style={{ fontSize: 22, color: "#2C595A" }} />
          <Title level={4} style={{ margin: 0 }}>
            {record?.nama_kambing}
          </Title>
        </span>
      }
    >
      <Row gutter={[24, 24]}>
        {/* Foto - Lebih Besar untuk Customer */}
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: "8px",
            }}
          >
            {renderImage()}
          </Card>
        </Col>

        {/* Info Produk */}
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: "8px",
            }}
          >
            {/* Nama Kambing */}
            <Title level={2} style={{ marginTop: 0, marginBottom: 16 }}>
              {record?.namaKambing}
            </Title>

            {/* Umur Badge */}
            <div style={{ marginBottom: "16px" }}>
              <Tag color="blue" style={{ fontSize: "14px", padding: "4px 12px" }}>
                {record?.umur} bulan
              </Tag>
            </div>

            {/* Harga - Highlight */}
            <div
              style={{
                backgroundColor: "#fef2e8",
                border: "2px solid #ffb85c",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <Text type="secondary" style={{ fontSize: 14 }}>
                Harga Satuan
              </Text>
              <Title
                level={2}
                style={{
                  color: "#d97706",
                  margin: "8px 0 0 0",
                  fontSize: "32px",
                }}
              >
                Rp {record?.harga?.toLocaleString("id-ID")}
              </Title>
            </div>

            {/* Keterangan */}
            {record?.keterangan && (
              <Card type="inner" style={{ marginBottom: "24px" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Keterangan
                </Text>
                <p style={{ marginTop: "8px" }}>{record.keterangan}</p>
              </Card>
            )}

            {/* Status */}
            {record?.status && (
              <div style={{ marginBottom: "24px" }}>
                {record.status === "tersedia" ? (
                  <Tag icon={<CheckCircleOutlined />} color="green">
                    Tersedia
                  </Tag>
                ) : (
                  <Tag color="red">Tidak Tersedia</Tag>
                )}
              </div>
            )}

            {/* Tombol Keranjang - Hanya jika tersedia */}
            {record?.status === "tersedia" && (
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
                loading={loadingAddToCart}
                disabled={isInCart}
                style={{
                  width: "100%",
                  backgroundColor: isInCart ? "#cccccc" : "#2C595A",
                  borderColor: isInCart ? "#cccccc" : "#2C595A",
                }}
              >
                {isInCart ? "Sudah di Keranjang" : "Tambah ke Keranjang"}
              </Button>
            )}
          </Card>
        </Col>
      </Row>
    </Show>
  );
};
