"use client";

import React, { useState } from "react";
import {
  BaseRecord,
  CanAccess,
  useApiUrl,
  useCustomMutation,
  useGetIdentity,
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
  Table,
} from "antd";
import {
  AppstoreOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNotification } from "@refinedev/core";
import UnauthorizedPage from "@app/unauthorized";

const { Text, Title } = Typography;

export const MaterialList = () => {
  const apiUrl = useApiUrl();
  const { open } = useNotification();
  const { data: identity } = useGetIdentity<any>();
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>(
    {}
  );
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const { tableProps } = useTable({
    syncWithLocation: true,
    resource: "materials",
  });

  const { mutate: addToCart } = useCustomMutation();

  const handleAddToCart = (materialId: number) => {
    const jumlah = quantities[materialId] || 1;

    setLoadingStates((prev) => ({ ...prev, [materialId]: true }));

    addToCart(
      {
        url: `${apiUrl}/customer/keranjang`,
        method: "post",
        values: {
          tipe_produk: "material",
          id_produk: materialId,
          jumlah: jumlah,
        },
      },
      {
        onSuccess: () => {
          open?.({
            type: "success",
            message: "Berhasil",
            description: "Material berhasil ditambahkan ke keranjang",
          });
          setLoadingStates((prev) => ({ ...prev, [materialId]: false }));
          // Reset quantity after success
          setQuantities((prev) => ({ ...prev, [materialId]: 1 }));
        },
        onError: (error) => {
          open?.({
            type: "error",
            message: "Gagal",
            description:
              error?.message || "Gagal menambahkan material ke keranjang",
          });
          setLoadingStates((prev) => ({ ...prev, [materialId]: false }));
        },
      }
    );
  };

  const handleQuantityChange = (materialId: number, value: number | null) => {
    setQuantities((prev) => ({ ...prev, [materialId]: value || 1 }));
  };

  const materials = tableProps?.dataSource || [];

  // Debug untuk melihat identity
  console.log("Identity:", identity);

  // Gunakan approach yang sama seperti access control provider
  const getUserRole = () => {
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

  const isAdmin = getUserRole() === "admin";

  console.log("User Role:", getUserRole());
  console.log("Is Admin:", isAdmin);

  // Kolom untuk tabel admin
  const adminColumns = [
    {
      title: "Gambar",
      dataIndex: "image",
      key: "image",
      width: 100,
      render: (image: string, record: BaseRecord) =>
        image ? (
          <Image
            src={`${apiUrl}/${image}`}
            alt={record.namaMaterial}
            width={60}
            height={60}
            style={{ objectFit: "cover", borderRadius: 4 }}
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              backgroundColor: "#f0f0f0",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text type="secondary" style={{ fontSize: 10 }}>
              img
            </Text>
          </div>
        ),
    },
    {
      title: "Nama Material",
      dataIndex: "namaMaterial",
      key: "namaMaterial",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Harga Satuan",
      dataIndex: "hargaSatuan",
      key: "hargaSatuan",
      render: (price: number) => (
        <Text strong style={{ color: "#1890ff" }}>
          Rp {price?.toLocaleString("id-ID")}
        </Text>
      ),
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_: any, record: BaseRecord) => (
        <Space>
          <ShowButton
            hideText
            size="small"
            recordItemId={record.id}
            icon={<EyeOutlined />}
            title="Detail"
          />
          <EditButton
            hideText
            size="small"
            recordItemId={record.id}
            title="Edit"
          />
          <DeleteButton
            hideText
            size="small"
            recordItemId={record.id}
            title="Hapus"
          />
        </Space>
      ),
    },
  ];

  return (
    <CanAccess
      resource="materials"
      action="list"
      fallback={<UnauthorizedPage />}
    >
      <List
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <AppstoreOutlined style={{ fontSize: 24, marginRight: 12 }} />
            <Text strong style={{ fontSize: 20 }}>
              Manajemen Material
            </Text>
          </div>
        }
        headerButtons={({ defaultButtons }) => <>{defaultButtons}</>}
      >
        <Spin spinning={!!tableProps?.loading}>
          {isAdmin ? (
            // Tampilan Tabel untuk Admin
            <Table
              dataSource={materials}
              columns={adminColumns}
              rowKey="id"
              pagination={{
                ...tableProps?.pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} dari ${total} material`,
              }}
            />
          ) : (
            // Tampilan Card untuk Customer
            <Row gutter={[16, 16]}>
              {materials.map((material: BaseRecord) => (
                <Col xs={24} sm={12} md={8} lg={6} key={material.id}>
                  <Card
                    hoverable
                    cover={
                      material.image ? (
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
                            src={`${apiUrl}/${material.image}`}
                            alt={material.namaMaterial}
                            preview={true}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
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
                          }}
                        >
                          <Text type="secondary">Tidak ada gambar</Text>
                        </div>
                      )
                    }
                    actions={[
                      <EditButton
                        key="edit"
                        hideText
                        size="small"
                        recordItemId={material.id}
                        title="Edit"
                      />,
                      <DeleteButton
                        key="delete"
                        hideText
                        size="small"
                        recordItemId={material.id}
                        title="Hapus"
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
                            style={{ marginBottom: 0, flex: 1 }}
                          >
                            {material.namaMaterial}
                          </Title>
                          <ShowButton
                            hideText
                            size="small"
                            recordItemId={material.id}
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
                          <Text
                            strong
                            style={{ fontSize: 16, color: "#1890ff" }}
                          >
                            Rp {material.hargaSatuan?.toLocaleString("id-ID")}
                          </Text>

                          <Space.Compact
                            style={{ width: "100%", marginTop: 8 }}
                          >
                            <InputNumber
                              min={1}
                              value={quantities[material.id as number] || 1}
                              onChange={(value) =>
                                handleQuantityChange(
                                  material.id as number,
                                  value
                                )
                              }
                              style={{ width: "40%" }}
                            />
                            <Button
                              type="primary"
                              icon={<ShoppingCartOutlined />}
                              onClick={() =>
                                handleAddToCart(material.id as number)
                              }
                              loading={loadingStates[material.id as number]}
                              style={{ width: "60%" }}
                            >
                              Keranjang
                            </Button>
                          </Space.Compact>
                        </Space>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </List>
    </CanAccess>
  );
};
