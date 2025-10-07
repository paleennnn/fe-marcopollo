"use client";

import React, { useState } from "react";
import {
  BaseRecord,
  CanAccess,
  useApiUrl,
  useCustomMutation,
} from "@refinedev/core";
import {
  List,
  ShowButton,
  EditButton,
  DeleteButton,
  useTable,
} from "@refinedev/antd";
import {
  Card,
  Row,
  Col,
  Typography,
  Image,
  Button,
  Space,
  InputNumber,
  Spin,
  Tag,
} from "antd";
import {
  ThunderboltFilled,
  ShoppingCartOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNotification } from "@refinedev/core";
import UnauthorizedPage from "@app/unauthorized";

const { Text, Title } = Typography;

export const KambingList = () => {
  const apiUrl = useApiUrl();
  const { open } = useNotification();
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>(
    {}
  );
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const { tableProps } = useTable({
    syncWithLocation: true,
    resource: "kambings",
  });

  const { mutate: addToCart } = useCustomMutation();

  const handleAddToCart = (kambingId: number) => {
    const jumlah = quantities[kambingId] || 1;

    setLoadingStates((prev) => ({ ...prev, [kambingId]: true }));

    addToCart(
      {
        url: `${apiUrl}/customer/keranjang`,
        method: "post",
        values: {
          tipe_produk: "kambing",
          id_produk: kambingId,
          jumlah: jumlah,
        },
      },
      {
        onSuccess: () => {
          open?.({
            type: "success",
            message: "Berhasil",
            description: "Kambing berhasil ditambahkan ke keranjang",
          });
          setLoadingStates((prev) => ({ ...prev, [kambingId]: false }));
          // Reset quantity after success
          setQuantities((prev) => ({ ...prev, [kambingId]: 1 }));
        },
        onError: (error) => {
          open?.({
            type: "error",
            message: "Gagal",
            description:
              error?.message || "Gagal menambahkan kambing ke keranjang",
          });
          setLoadingStates((prev) => ({ ...prev, [kambingId]: false }));
        },
      }
    );
  };

  const handleQuantityChange = (kambingId: number, value: number | null) => {
    setQuantities((prev) => ({ ...prev, [kambingId]: value || 1 }));
  };

  const kambings = tableProps?.dataSource || [];

  return (
    <CanAccess
      resource="kambings"
      action="list"
      fallback={<UnauthorizedPage />}
    >
      <List
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <ThunderboltFilled style={{ fontSize: 24, marginRight: 12 }} />
            <Text strong style={{ fontSize: 20 }}>
              Manajemen Kambing
            </Text>
          </div>
        }
        headerButtons={({ defaultButtons }) => <>{defaultButtons}</>}
      >
        <Spin spinning={!!tableProps?.loading}>
          <Row gutter={[16, 16]}>
            {kambings.map((kambing: BaseRecord) => (
              <Col xs={24} sm={12} md={8} lg={6} key={kambing.id}>
                <Card
                  hoverable
                  cover={
                    <div style={{ position: "relative" }}>
                      {kambing.image ? (
                        <div
                          style={{
                            height: 200,
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#f0f0f0",
                          }}
                        >
                          <Image
                            src={`${apiUrl}/${kambing.image}`}
                            alt={kambing.namaKambing}
                            preview={true}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              filter: kambing.sudah_dibooking
                                ? "grayscale(50%)"
                                : "none",
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            height: 200,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#f0f0f0",
                            filter: kambing.sudah_dibooking
                              ? "grayscale(50%)"
                              : "none",
                          }}
                        >
                          <Text type="secondary">Tidak ada foto</Text>
                        </div>
                      )}

                      {/* Status Badge untuk kambing yang sudah dibooking */}
                      {kambing.sudah_dibooking && (
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            backgroundColor: "rgba(255, 0, 0, 0.8)",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          SUDAH DIBOOKING
                        </div>
                      )}
                    </div>
                  }
                  actions={[
                    <EditButton
                      key="edit"
                      hideText
                      size="small"
                      recordItemId={kambing.id}
                      title="Edit kambing"
                    />,
                    <DeleteButton
                      key="delete"
                      hideText
                      size="small"
                      recordItemId={kambing.id}
                      title="Hapus kambing"
                    />,
                  ]}
                >
                  <Card.Meta
                    title={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Title
                          level={5}
                          ellipsis={{ rows: 2 }}
                          style={{
                            marginBottom: 0,
                            flex: 1,
                            color: kambing.sudah_dibooking ? "#999" : "inherit",
                          }}
                        >
                          {kambing.namaKambing}
                        </Title>
                        <ShowButton
                          hideText
                          size="small"
                          recordItemId={kambing.id}
                          icon={<EyeOutlined />}
                          title="Detail"
                          style={{ marginLeft: 8 }}
                        />
                      </div>
                    }
                    description={
                      <Space
                        direction="vertical"
                        style={{ width: "100%" }}
                        size="small"
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Tag color="blue">{kambing.umur} bulan</Tag>
                          {kambing.sudah_dibooking && (
                            <Tag color="red" icon={<CheckCircleOutlined />}>
                              Sudah Dibooking
                            </Tag>
                          )}
                        </div>

                        <Text
                          strong
                          style={{
                            fontSize: 16,
                            color: kambing.sudah_dibooking ? "#999" : "#1890ff",
                          }}
                        >
                          Rp {kambing.harga?.toLocaleString("id-ID")}
                        </Text>

                        {/* Conditional rendering untuk tombol keranjang */}
                        {!kambing.sudah_dibooking ? (
                          <Space.Compact
                            style={{ width: "100%", marginTop: 8 }}
                          >
                            <InputNumber
                              min={1}
                              value={quantities[kambing.id] || 1}
                              onChange={(value) =>
                                handleQuantityChange(kambing.id, value)
                              }
                              style={{ width: "40%" }}
                            />
                            <Button
                              type="primary"
                              icon={<ShoppingCartOutlined />}
                              onClick={() => handleAddToCart(kambing.id)}
                              loading={loadingStates[kambing.id]}
                              style={{ width: "60%" }}
                            >
                              Keranjang
                            </Button>
                          </Space.Compact>
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              marginTop: 8,
                              textAlign: "center",
                              padding: "8px",
                              backgroundColor: "#f5f5f5",
                              borderRadius: "4px",
                              border: "1px dashed #d9d9d9",
                            }}
                          >
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              Kambing tidak tersedia
                            </Text>
                          </div>
                        )}
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Spin>
      </List>
    </CanAccess>
  );
};
