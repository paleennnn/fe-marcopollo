"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import {
  Typography,
  Card,
  Row,
  Col,
  Tag,
  Table,
  Image,
  Button,
  Modal,
  Descriptions,
  Space,
  Divider,
  Input,
} from "antd";
import { EyeOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useApiUrl, useCustomMutation, useInvalidate } from "@refinedev/core";
import { useNotification } from "@refinedev/core";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

export const OrdersShow = () => {
  const apiUrl = useApiUrl();
  const { open } = useNotification();
  const invalidate = useInvalidate();
  const router = useRouter();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [verifikasiLoading, setVerifikasiLoading] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [catatanAdmin, setCatatanAdmin] = useState("");

  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;

  const { mutate: verifikasiOrder } = useCustomMutation();

  // Coba beberapa kemungkinan struktur data
  const orderData = data?.data?.data || data?.data || data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "selesai":
        return "green";
      case "menunggu_verifikasi":
        return "orange";
      case "ditolak":
        return "red";
      default:
        return "blue";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "selesai":
        return "Selesai";
      case "menunggu_verifikasi":
        return "Menunggu Verifikasi";
      case "ditolak":
        return "Ditolak";
      default:
        return status;
    }
  };

  const handleVerifikasi = (status: "selesai" | "ditolak") => {
    if (status === "ditolak") {
      setIsRejectModalOpen(true);
    } else {
      setIsApproveModalOpen(true);
    }
  };

  const submitVerifikasi = (status: string, catatan: string = "") => {
    if (!orderData?.idOrder) return;

    setVerifikasiLoading(true);
    verifikasiOrder(
      {
        url: `${apiUrl}/orders/${orderData.idOrder}/verifikasi`,
        method: "put",
        values: {
          status: status,
          catatan_admin: catatan || undefined,
        },
      },
      {
        onSuccess: () => {
          setVerifikasiLoading(false);
          setIsApproveModalOpen(false);
          setIsRejectModalOpen(false);
          setCatatanAdmin("");
          invalidate({
            resource: "orders",
            invalidates: ["detail", "list"],
          });

          open?.({
            type: "success",
            message: "Berhasil",
            description: `Order berhasil ${
              status === "selesai" ? "disetujui" : "ditolak"
            }`,
          });
          
          setTimeout(() => {
            router.push("/orders");
          }, 1000);
        },
        onError: (error) => {
          setVerifikasiLoading(false);
          open?.({
            type: "error",
            message: "Gagal",
            description: error?.message || "Gagal memverifikasi order",
          });
        },
      }
    );
  };

  const handleApproveModalOk = () => {
    submitVerifikasi("selesai", catatanAdmin);
  };

  const handleRejectModalOk = () => {
    if (!catatanAdmin.trim()) {
      open?.({
        type: "error",
        message: "Peringatan",
        description: "Catatan admin harus diisi saat menolak order",
      });
      return;
    }
    submitVerifikasi("ditolak", catatanAdmin);
  };

  const handleModalCancel = () => {
    setIsApproveModalOpen(false);
    setIsRejectModalOpen(false);
    setCatatanAdmin("");
  };

  if (isLoading) {
    return <Show isLoading={isLoading} />;
  }

  // Debug UI untuk melihat data
  if (!orderData) {
    return (
      <Show>
        <Card title="Debug Info">
          <pre>{JSON.stringify(data, null, 2)}</pre>
          <Text type="danger">Data order tidak ditemukan</Text>
        </Card>
      </Show>
    );
  }

  // const orderDetailsColumns = [
  //   {
  //     title: "Produk",
  //     dataIndex: "namaProduk",
  //     key: "namaProduk",
  //     render: (value: string, record: any) => (
  //       <Space>
  //         {record.material?.image || record.kambing?.image ? (
  //           <Image
  //             src={
  //               record.tipeProduk === "material"
  //                 ? record.material.image.startsWith("http")
  //                   ? record.material.image
  //                   : `${apiUrl}/${record.material.image}`
  //                 : record.kambing.image.startsWith("http")
  //                 ? record.kambing.image
  //                 : `${apiUrl}/${record.kambing.image}`
  //             }
  //             alt={value}
  //             width={50}
  //             height={50}
  //             style={{ objectFit: "cover", borderRadius: 4 }}
  //           />
  //         ) : (
  //           <div
  //             style={{
  //               width: 50,
  //               height: 50,
  //               backgroundColor: "#f0f0f0",
  //               borderRadius: 4,
  //               display: "flex",
  //               alignItems: "center",
  //               justifyContent: "center",
  //             }}
  //           >
  //             <Text type="secondary" style={{ fontSize: 10 }}>
  //               img
  //             </Text>
  //           </div>
  //         )}
  //         <div>
  //           <Text strong>{value}</Text>
  //           <br />
  //           <Tag color="blue">{record.tipeProduk}</Tag>
  //         </div>
  //       </Space>
  //     ),
  //   },
  //   {
  //     title: "Harga Satuan",
  //     dataIndex: "hargaSatuan",
  //     key: "hargaSatuan",
  //     align: "right" as const,
  //     render: (value: string) => (
  //       <Text>Rp {parseFloat(value).toLocaleString("id-ID")}</Text>
  //     ),
  //   },
  //   {
  //     title: "Jumlah",
  //     dataIndex: "jumlah",
  //     key: "jumlah",
  //     align: "center" as const,
  //   },
  //   {
  //     title: "Subtotal",
  //     dataIndex: "subtotal",
  //     key: "subtotal",
  //     align: "right" as const,
  //     render: (value: string) => (
  //       <Text strong>Rp {parseFloat(value).toLocaleString("id-ID")}</Text>
  //     ),
  //   },
  // ];

  const orderDetailsColumns = [
    {
      title: "Produk",
      dataIndex: "namaProduk",
      key: "namaProduk",
      render: (value: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          <Tag color="blue">{record.tipeProduk}</Tag>
        </Space>
      ),
    },
    {
      title: "Harga Satuan",
      dataIndex: "hargaSatuan",
      key: "hargaSatuan",
      align: "right" as const,
      render: (value: string) => (
        <Text>Rp {parseFloat(value).toLocaleString("id-ID")}</Text>
      ),
    },
    {
      title: "Jumlah",
      dataIndex: "jumlah",
      key: "jumlah",
      align: "center" as const,
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      align: "right" as const,
      render: (value: string) => (
        <Text strong>Rp {parseFloat(value).toLocaleString("id-ID")}</Text>
      ),
    },
];

  return (
    <>
      <Show isLoading={isLoading}>
        <Row gutter={[16, 16]}>
          {/* Informasi Order */}
          <Col span={24}>
            <Card title="Informasi Order" size="small">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Nomor Order" span={1}>
                  <Text strong>{orderData.nomorOrder}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status" span={1}>
                  <Tag color={getStatusColor(orderData.statusPembayaran)}>
                    {getStatusLabel(orderData.statusPembayaran)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tanggal Order" span={1}>
                  {dayjs(orderData.tanggalOrder).format("DD MMMM YYYY HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label="Total Harga" span={1}>
                  <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
                    Rp{" "}
                    {parseFloat(orderData.totalHarga).toLocaleString("id-ID")}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Metode Pembayaran" span={1}>
                  <Tag color="blue">
                    {orderData.metodePembayaran?.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Bukti Pembayaran" span={1}>
                  {orderData.buktiPembayaran ? (
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() =>
                        setPreviewImage(
                          `${apiUrl}/storage/uploads/bukti_pembayaran/${orderData.buktiPembayaran}`
                        )
                      }
                    >
                      Lihat Bukti
                    </Button>
                  ) : orderData.metodePembayaran === "tunai" ? (
                    <Tag color="gold">Pembayaran Tunai</Tag>
                  ) : (
                    <Text type="secondary">Belum Upload</Text>
                  )}
                </Descriptions.Item>
                {orderData.tanggalUploadBukti && (
                  <Descriptions.Item label="Tanggal Upload Bukti" span={1}>
                    {dayjs(orderData.tanggalUploadBukti).format(
                      "DD MMMM YYYY HH:mm"
                    )}
                  </Descriptions.Item>
                )}
                {orderData.tanggalVerifikasi && (
                  <Descriptions.Item label="Tanggal Verifikasi" span={1}>
                    {dayjs(orderData.tanggalVerifikasi).format(
                      "DD MMMM YYYY HH:mm"
                    )}
                  </Descriptions.Item>
                )}
                {orderData.catatanAdmin && (
                  <Descriptions.Item label="Catatan Admin" span={2}>
                    <Text
                      type={
                        orderData.statusPembayaran === "ditolak"
                          ? "danger"
                          : "success"
                      }
                      style={{
                        backgroundColor:
                          orderData.statusPembayaran === "ditolak"
                            ? "#fff2f0"
                            : "#f6ffed",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border:
                          orderData.statusPembayaran === "ditolak"
                            ? "1px solid #ffccc7"
                            : "1px solid #b7eb8f",
                        display: "block",
                      }}
                    >
                      {orderData.catatanAdmin}
                    </Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>

          {/* Informasi Customer */}
          <Col span={24}>
            <Card title="Informasi Customer" size="small">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Nama Lengkap" span={1}>
                  <Text strong>{orderData.user?.fullname || "-"}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Username" span={1}>
                  {orderData.user?.username || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={1}>
                  {orderData.user?.email || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Telepon" span={1}>
                  {orderData.user?.phone || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Alamat" span={2}>
                  {orderData.user?.address || "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Detail Items Order */}
          <Col span={24}>
            <Card
              title={`Detail Items (${
                orderData.orderDetails?.length || 0
              } item)`}
              size="small"
            >
              <Table
                dataSource={orderData.orderDetails || []}
                columns={orderDetailsColumns}
                rowKey="idOrderDetail"
                pagination={false}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong style={{ fontSize: 16 }}>
                        Total:
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
                        Rp{" "}
                        {parseFloat(orderData.totalHarga).toLocaleString(
                          "id-ID"
                        )}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </Card>
          </Col>

          {/* Action Buttons */}
          {orderData.statusPembayaran === "menunggu_verifikasi" && (
            <Col span={24}>
              <Card size="small">
                <Space
                  size="large"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckOutlined />}
                    onClick={() => handleVerifikasi("selesai")}
                    loading={verifikasiLoading}
                    style={{ minWidth: 120 }}
                  >
                    Setujui Order
                  </Button>
                  <Button
                    danger
                    size="large"
                    icon={<CloseOutlined />}
                    onClick={() => handleVerifikasi("ditolak")}
                    loading={verifikasiLoading}
                    style={{ minWidth: 120 }}
                  >
                    Tolak Order
                  </Button>
                </Space>
              </Card>
            </Col>
          )}
        </Row>
      </Show>

      {/* Modal Preview Bukti Pembayaran */}
      <Modal
        title="Bukti Pembayaran"
        open={!!previewImage}
        onCancel={() => setPreviewImage(null)}
        footer={null}
        width={600}
      >
        {previewImage && (
          <Image
            src={previewImage}
            alt="Bukti Pembayaran"
            style={{ width: "100%", borderRadius: 8 }}
          />
        )}
      </Modal>

      {/* Modal Setujui Order */}
      <Modal
        title="Setujui Order"
        open={isApproveModalOpen}
        onCancel={handleModalCancel}
        onOk={handleApproveModalOk}
        okText="Setujui Order"
        cancelText="Batal"
        okButtonProps={{ loading: verifikasiLoading }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Nomor Order: </Text>
          <Text>{orderData?.nomorOrder}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Customer: </Text>
          <Text>{orderData?.user?.fullname}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Total: </Text>
          <Text>
            Rp {parseFloat(orderData?.totalHarga || 0).toLocaleString("id-ID")}
          </Text>
        </div>
        <div>
          <Text strong>Catatan Admin: </Text>
          <Text type="secondary">(Opsional)</Text>
          <TextArea
            rows={4}
            placeholder="Masukkan catatan persetujuan (opsional)..."
            value={catatanAdmin}
            onChange={(e) => setCatatanAdmin(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>

      {/* Modal Tolak Order */}
      <Modal
        title="Tolak Order"
        open={isRejectModalOpen}
        onCancel={handleModalCancel}
        onOk={handleRejectModalOk}
        okText="Tolak Order"
        cancelText="Batal"
        okButtonProps={{ danger: true, loading: verifikasiLoading }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Nomor Order: </Text>
          <Text>{orderData?.nomorOrder}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Customer: </Text>
          <Text>{orderData?.user?.fullname}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Total: </Text>
          <Text>
            Rp {parseFloat(orderData?.totalHarga || 0).toLocaleString("id-ID")}
          </Text>
        </div>
        <div>
          <Text strong>Catatan Admin: </Text>
          <Text type="danger">*</Text>
          <TextArea
            rows={4}
            placeholder="Masukkan alasan penolakan order..."
            value={catatanAdmin}
            onChange={(e) => setCatatanAdmin(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>
    </>
  );
};
