"use client";

import { useState } from "react";
import { List, useTable, ShowButton } from "@refinedev/antd";
import {
  Table,
  Space,
  Tag,
  Typography,
  Button,
  Modal,
  Image,
  Upload,
  Card,
  Row,
  Col,
} from "antd";
import { CreditCardOutlined, UploadOutlined } from "@ant-design/icons";
import { useApiUrl, useCustomMutation, useInvalidate } from "@refinedev/core";
import { useNotification } from "@refinedev/core";
import dayjs from "dayjs";
import type { UploadFile } from "antd";

const { Text, Title } = Typography;

export default function CustomerOrdersList() {
  const apiUrl = useApiUrl();
  const { open } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);

  const { tableProps } = useTable({
    resource: "customer/orders",
    syncWithLocation: true,
    queryOptions: {
      refetchOnWindowFocus: true,
    },
  });

  const { mutate: uploadBukti } = useCustomMutation();
  const invalidate = useInvalidate();

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

  const getStatusLabel = (
    status: string,
    metodePembayaran: string,
    buktiPembayaran: string | null
  ) => {
    // Jika QRIS dan belum upload bukti, status jadi "Belum Bayar"
    if (metodePembayaran === "qris" && !buktiPembayaran) {
      return "Belum Bayar";
    }

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

  const handleBayar = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleUploadBukti = () => {
    if (fileList.length === 0) {
      open?.({
        type: "error",
        message: "Peringatan",
        description: "Pilih file bukti pembayaran terlebih dahulu",
      });
      return;
    }

    const formData = new FormData();
    formData.append("bukti_pembayaran", fileList[0].originFileObj as Blob);

    setUploadLoading(true);
    uploadBukti(
      {
        url: `${apiUrl}/customer/orders/${selectedOrder.idOrder}/upload-bukti`,
        method: "post",
        values: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      },
      {
        onSuccess: () => {
          setUploadLoading(false);
          setIsModalOpen(false);
          setFileList([]);
          setSelectedOrder(null);

          // Invalidate cache untuk refresh data
          invalidate({
            resource: "customer/orders",
            invalidates: ["list"],
          });

          open?.({
            type: "success",
            message: "Berhasil",
            description:
              "Bukti pembayaran berhasil diupload. Tunggu konfirmasi admin.",
          });
        },
        onError: (error) => {
          setUploadLoading(false);
          open?.({
            type: "error",
            message: "Gagal",
            description: error?.message || "Gagal mengupload bukti pembayaran",
          });
        },
      }
    );
  };

  const apiData = (tableProps.dataSource as any)?.data || [];
  const safeTableProps = {
    ...tableProps,
    dataSource: Array.isArray(apiData)
      ? apiData.map((item: any) => ({
          idOrder: item.idOrder,
          nomorOrder: item.nomorOrder,
          tanggalOrder: item.tanggalOrder,
          totalHarga: item.totalHarga,
          metodePembayaran: item.metodePembayaran,
          statusPembayaran: item.statusPembayaran,
          buktiPembayaran: item.buktiPembayaran,
          orderDetails: item.orderDetails,
        }))
      : [],
  };

  return (
    <>
      <List>
        <Table {...safeTableProps} rowKey="idOrder">
          <Table.Column
            dataIndex="nomorOrder"
            title="Nomor Order"
            sorter
            render={(value) => <Text strong>{value}</Text>}
          />
          <Table.Column
            dataIndex="tanggalOrder"
            title="Tanggal Order"
            sorter
            render={(value) => dayjs(value).format("DD MMM YYYY HH:mm")}
          />
          <Table.Column
            dataIndex="totalHarga"
            title="Total"
            align="right"
            render={(value) =>
              new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(parseFloat(value))
            }
          />
          <Table.Column
            dataIndex="metodePembayaran"
            title="Metode"
            render={(value) => <Tag color="blue">{value?.toUpperCase()}</Tag>}
          />
          <Table.Column
            title="Status"
            render={(_, record: any) => {
              const status = getStatusLabel(
                record.statusPembayaran,
                record.metodePembayaran,
                record.buktiPembayaran
              );
              const color =
                record.metodePembayaran === "qris" && !record.buktiPembayaran
                  ? "red"
                  : getStatusColor(record.statusPembayaran);
              return <Tag color={color}>{status}</Tag>;
            }}
          />
          <Table.Column
            dataIndex="orderDetails"
            title="Item"
            render={(details: any[]) => (
              <Text type="secondary">{details?.length || 0} item</Text>
            )}
          />
          <Table.Column
            title="Aksi"
            dataIndex="actions"
            render={(_, record: any) => (
              <Space>
                <ShowButton
                  hideText
                  size="small"
                  recordItemId={record.idOrder}
                />
                {record.metodePembayaran === "qris" &&
                  !record.buktiPembayaran && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<CreditCardOutlined />}
                      onClick={() => handleBayar(record)}
                    >
                      Bayar
                    </Button>
                  )}
              </Space>
            )}
          />
        </Table>
      </List>

      {/* Modal Detail Order & Upload Bukti */}
      <Modal
        title={<Title level={4}>Pembayaran Order</Title>}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setFileList([]);
          setSelectedOrder(null);
        }}
        footer={null}
        width={900}
      >
        {selectedOrder && (
          <>
            {/* Detail Order */}
            <div style={{ marginBottom: 24 }}>
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text strong>Nomor Order:</Text>
                    <Text>{selectedOrder.nomorOrder}</Text>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text strong>Tanggal:</Text>
                    <Text>
                      {dayjs(selectedOrder.tanggalOrder).format(
                        "DD MMM YYYY HH:mm"
                      )}
                    </Text>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text strong>Metode Pembayaran:</Text>
                    <Tag color="blue">
                      {selectedOrder.metodePembayaran?.toUpperCase()}
                    </Tag>
                  </div>
                </Space>
              </Card>

              <Table
                dataSource={selectedOrder.orderDetails}
                rowKey="idOrderDetail"
                pagination={false}
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Table.Column
                  dataIndex="namaProduk"
                  title="Produk"
                  render={(value, record: any) => (
                    <Space>
                      {record.material?.image || record.kambing?.image ? (
                        <Image
                          src={
                            record.tipeProduk === "material"
                              ? `${apiUrl}/${record.material.image}`
                              : `${apiUrl}/${record.kambing.image}`
                          }
                          alt={value}
                          width={40}
                          height={40}
                          style={{ objectFit: "cover", borderRadius: 4 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
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
                      )}
                      <Text>{value}</Text>
                    </Space>
                  )}
                />
                <Table.Column
                  dataIndex="hargaSatuan"
                  title="Harga"
                  render={(value) =>
                    `Rp ${parseFloat(value).toLocaleString("id-ID")}`
                  }
                />
                <Table.Column dataIndex="jumlah" title="Jumlah" />
                <Table.Column
                  dataIndex="subtotal"
                  title="Subtotal"
                  render={(value) => (
                    <Text>Rp {parseFloat(value).toLocaleString("id-ID")}</Text>
                  )}
                />
              </Table>

              <div
                style={{
                  textAlign: "right",
                  borderTop: "2px solid #f0f0f0",
                  paddingTop: 16,
                }}
              >
                <Text strong style={{ fontSize: 18 }}>
                  Total: Rp{" "}
                  {parseFloat(selectedOrder.totalHarga).toLocaleString("id-ID")}
                </Text>
              </div>
            </div>

            {/* Upload Bukti Pembayaran */}
            <div style={{ display: "flex", gap: 24 }}>
              {/* Sisi Kiri - QR Code */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 24,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 8,
                }}
              >
                <Text strong style={{ marginBottom: 16, fontSize: 16 }}>
                  Scan QRIS untuk Pembayaran
                </Text>
                <Image
                  src="/images/qris.png"
                  alt="QRIS"
                  width={250}
                  height={250}
                  style={{ objectFit: "contain" }}
                  preview={false}
                />
                <Text
                  type="secondary"
                  style={{ marginTop: 16, textAlign: "center" }}
                >
                  Scan kode QR di atas menggunakan aplikasi pembayaran Anda
                </Text>
              </div>

              {/* Sisi Kanan - Upload Form */}
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <Text style={{ display: "block", marginBottom: 16 }}>
                  Setelah melakukan pembayaran, silahkan upload bukti pembayaran
                  Anda. Tunggu konfirmasi dari admin.
                </Text>

                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  beforeUpload={() => false}
                  onChange={({ fileList: newFileList }) =>
                    setFileList(newFileList)
                  }
                  maxCount={1}
                  accept="image/*"
                  style={{ marginBottom: 24 }}
                >
                  {fileList.length < 1 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Upload Bukti</div>
                    </div>
                  )}
                </Upload>

                <div style={{ marginTop: "auto", textAlign: "right" }}>
                  <Button
                    onClick={() => {
                      setIsModalOpen(false);
                      setFileList([]);
                      setSelectedOrder(null);
                    }}
                    style={{ marginRight: 8 }}
                  >
                    Batal
                  </Button>
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={handleUploadBukti}
                    loading={uploadLoading}
                    disabled={fileList.length === 0}
                  >
                    Upload
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
