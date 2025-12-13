"use client";

import React, { useState } from "react";
import { useShow, useApiUrl, CanAccess, useCustomMutation } from "@refinedev/core";
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
import { AppstoreOutlined, CalendarOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useNotification } from "@refinedev/core";
import UnauthorizedPage from "@app/unauthorized";

const { Title, Text } = Typography;

export const MaterialShow = () => {
  const { query } = useShow();
  const { data, isLoading, isError } = query;
  const record = data?.data;
  const apiUrl = useApiUrl();
  const { open } = useNotification();

  const [quantity, setQuantity] = useState(1);
  const [loadingAddToCart, setLoadingAddToCart] = useState(false);
  const { mutate: addToCart } = useCustomMutation();

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
    if (!record?.harga_beli || !record?.harga_satuan) return 0;
    const profit = record.harga_satuan - record.harga_beli;
    const margin = (profit / record.harga_beli) * 100;
    return margin.toFixed(2);
  };

  const handleAddToCart = () => {
    if (!record?.id_material) return;

    setLoadingAddToCart(true);
    addToCart(
      {
        url: `${apiUrl}/customer/keranjang`,
        method: "post",
        values: {
          tipe_produk: "material",
          id_produk: record.id_material,
          jumlah: quantity,
        },
      },
      {
        onSuccess: () => {
          open?.({
            type: "success",
            message: "Berhasil",
            description: "Material berhasil ditambahkan ke keranjang",
          });
          setLoadingAddToCart(false);
          setQuantity(1);
        },
        onError: (error: any) => {
          open?.({
            type: "error",
            message: "Gagal",
            description:
              error?.message || "Gagal menambahkan material ke keranjang",
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
        <Text>Gagal memuat detail material.</Text>
      </Card>
    );
  }

  // ========== TAMPILAN ADMIN ==========
  const renderImage = () => {
    if (!record?.image) {
      return <Text type="secondary">Tidak ada gambar</Text>;
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
        alt={record.nama_material}
        style={{ maxWidth: "100%", borderRadius: "8px" }}
      />
    );
  };

  if (isAdmin) {
    return (
      <CanAccess
        resource="materials"
        action="show"
        fallback={<UnauthorizedPage />}
      >
        <Show
          title={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AppstoreOutlined style={{ fontSize: 22, color: "#1890ff" }} />
              <Title level={4} style={{ margin: 0 }}>
                Detail Material
              </Title>
            </span>
          }
        >
          <Row gutter={[16, 16]}>
            {/* Informasi Material */}
            <Col xs={24} lg={16}>
              <Card title="Informasi Material" bordered={false}>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Nama Material">
                    {record?.nama_material ?? "-"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Harga Beli">
                    <Text strong style={{ color: "#f5222d" }}>
                      Rp {record?.harga_beli?.toLocaleString("id-ID") ?? "-"}
                    </Text>
                  </Descriptions.Item>

                  <Descriptions.Item label="Harga Jual/Satuan">
                    <Text strong style={{ color: "#52c41a" }}>
                      Rp {record?.harga_satuan?.toLocaleString("id-ID") ?? "-"}
                    </Text>
                  </Descriptions.Item>

                  <Descriptions.Item label="Margin Keuntungan">
                    {record?.harga_beli && record?.harga_satuan ? (
                      <>
                        <Tag color="blue">{calculateMargin()}%</Tag>
                        <Text style={{ marginLeft: 8 }}>
                          (Rp{" "}
                          {(
                            record.harga_satuan - record.harga_beli
                          ).toLocaleString("id-ID")})
                        </Text>
                      </>
                    ) : (
                      "-"
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Tanggal Dibuat">
                    <CalendarOutlined />{" "}
                    {record?.created_at ? (
                      <DateField
                        value={record.created_at}
                        format="DD MMM YYYY HH:mm"
                      />
                    ) : (
                      "-"
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Terakhir Diperbarui">
                    <CalendarOutlined />{" "}
                    {record?.updated_at ? (
                      <DateField
                        value={record.updated_at}
                        format="DD MMM YYYY HH:mm"
                      />
                    ) : (
                      "-"
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {/* Gambar */}
            <Col xs={24} lg={8}>
              <Card title="Gambar Material" bordered={false}>
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
            {record?.nama_material}
          </Title>
        </span>
      }
    >
      <Row gutter={[24, 24]}>
        {/* Gambar - Lebih Besar untuk Customer */}
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
            {/* Nama Produk */}
            <Title level={2} style={{ marginTop: 0, marginBottom: 16 }}>
              {record?.nama_material}
            </Title>

            {/* Harga - Highlight */}
            <div
              style={{
                backgroundColor: "#f6ffed",
                border: "2px solid #b7eb8f",
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
                  color: "#52c41a",
                  margin: "8px 0 0 0",
                  fontSize: "32px",
                }}
              >
                Rp {record?.harga_satuan?.toLocaleString("id-ID")}
              </Title>
            </div>

            {/* Quantity & Keranjang */}
            <Card
              type="inner"
              title="Jumlah Pesanan"
              style={{ marginBottom: "24px" }}
            >
              <Space.Compact style={{ width: "100%" }}>
                <InputNumber
                  min={1}
                  max={999}
                  value={quantity}
                  onChange={(value) => setQuantity(value || 1)}
                  style={{ width: "40%" }}
                  size="large"
                />
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleAddToCart}
                  loading={loadingAddToCart}
                  style={{
                    width: "60%",
                    backgroundColor: "#2C595A",
                    borderColor: "#2C595A",
                  }}
                >
                  Keranjang
                </Button>
              </Space.Compact>
            </Card>

            {/* Info Tambahan */}
            <Card type="inner" title="Informasi Produk">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Kode Produk">
                  {record?.id_material ? `MAT-${record.id_material}` : "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Tersedia">
                  <Tag color="green">Stok Tersedia</Tag>
                </Descriptions.Item>

                {/* <Descriptions.Item label="Garansi Keaslian">
                  <Text type="success">✓ 100% Asli</Text>
                </Descriptions.Item> */}
              </Descriptions>
            </Card>
          </Card>
        </Col>
      </Row>
    </Show>
  );
};
