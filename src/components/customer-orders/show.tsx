"use client";

import { Show } from "@refinedev/antd";
import { useShow, useApiUrl } from "@refinedev/core";
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Typography,
  Image,
  Space,
  Divider,
} from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

import { useState } from "react";
import { RefundModal } from "./refund-modal";
import { Button } from "antd";

export const CustomerOrdersShow = () => {
  const apiUrl = useApiUrl();
  const { queryResult } = useShow({
    resource: "customer/orders",
  });

  const { data, isLoading } = queryResult;
  const record = data?.data?.data;

  // Refund Modal State
  const [isRefundModalVisible, setIsRefundModalVisible] = useState(false);
  const [selectedOrderDetailId, setSelectedOrderDetailId] = useState<
    number | null
  >(null);

  const handleRefundClick = (orderDetailId: number) => {
    setSelectedOrderDetailId(orderDetailId);
    setIsRefundModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "selesai":
        return "green";
      case "dikirim":
        return "blue";
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
    if (metodePembayaran === "qris" && !buktiPembayaran) {
      return "Belum Bayar";
    }

    switch (status) {
      case "selesai":
        return "Selesai";
      case "dikirim":
        return "Sedang Dikirim";
      case "menunggu_verifikasi":
        return "Menunggu Verifikasi";
      case "ditolak":
        return "Ditolak";
      default:
        return status;
    }
  };

  // Check if refund is available (within 7 days of completion)
  const isRefundAvailable = (tanggalSelesai: string | null) => {
    if (!tanggalSelesai) return false;
    const diffDays = dayjs().diff(dayjs(tanggalSelesai), "day");
    return diffDays <= 7;
  };

  return (
    <Show isLoading={isLoading}>
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>Informasi Order</Title>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Nomor Order" span={2}>
            <Text strong style={{ fontSize: 16 }}>
              {record?.nomorOrder}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Tanggal Order">
            {record?.tanggalOrder
              ? dayjs(record.tanggalOrder).format("DD MMMM YYYY, HH:mm")
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Total Harga">
            <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
              Rp {parseFloat(record?.totalHarga || 0).toLocaleString("id-ID")}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Metode Pembayaran">
            <Tag color="blue">{record?.metodePembayaran?.toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status Pembayaran">
            <Tag
              color={
                record?.metodePembayaran === "qris" && !record?.buktiPembayaran
                  ? "red"
                  : getStatusColor(record?.statusPembayaran)
              }
            >
              {getStatusLabel(
                record?.statusPembayaran,
                record?.metodePembayaran,
                record?.buktiPembayaran
              )}
            </Tag>
          </Descriptions.Item>
          {record?.tanggalUploadBukti && (
            <Descriptions.Item label="Tanggal Upload Bukti">
              {dayjs(record.tanggalUploadBukti).format("DD MMMM YYYY, HH:mm")}
            </Descriptions.Item>
          )}
          {record?.tanggalVerifikasi && (
            <Descriptions.Item label="Tanggal Verifikasi">
              {dayjs(record.tanggalVerifikasi).format("DD MMMM YYYY, HH:mm")}
            </Descriptions.Item>
          )}
          {record?.catatanAdmin && (
            <Descriptions.Item label="Catatan Admin" span={2}>
              <Text>{record.catatanAdmin}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {record?.buktiPembayaran && (
        <Card style={{ marginBottom: 16 }}>
          <Title level={4}>Bukti Pembayaran</Title>
          <Image
            src={`${apiUrl}/storage/uploads/bukti_pembayaran/${record.buktiPembayaran}`}
            alt="Bukti Pembayaran"
            style={{ maxWidth: 400, borderRadius: 8 }}
          />
        </Card>
      )}

      <Card>
        <Title level={4}>Detail Produk</Title>
        <Table
          dataSource={record?.orderDetails || []}
          rowKey="idOrderDetail"
          pagination={false}
          summary={(pageData: ReadonlyArray<{ subtotal: string }>) => {
            const total = pageData.reduce(
              (sum, item) => sum + parseFloat(item.subtotal),
              0
            );
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4} align="right">
                    <Text strong style={{ fontSize: 16 }}>
                      Total:
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
                      Rp {total.toLocaleString("id-ID")}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        >
          <Table.Column
            title="Produk"
            key="product"
            render={(_, record: any) => (
              <Space>
                {record.material?.image || record.kambing?.image ? (
                  <Image
                    src={
                      record.tipeProduk === "material"
                        ? `${apiUrl}/${record.material.image}`
                        : `${apiUrl}/${record.kambing.image}`
                    }
                    alt={record.namaProduk}
                    width={60}
                    height={60}
                    style={{ objectFit: "cover", borderRadius: 8 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      backgroundColor: "#f0f0f0",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text type="secondary">No Image</Text>
                  </div>
                )}
                <div>
                  <Text strong>{record.namaProduk}</Text>
                  <br />
                  <Tag color="geekblue" style={{ marginTop: 4 }}>
                    {record.tipeProduk === "material" ? "Material" : "Kambing"}
                  </Tag>
                </div>
              </Space>
            )}
          />
          <Table.Column
            title="Harga Satuan"
            dataIndex="hargaSatuan"
            align="right"
            render={(value) => (
              <Text>Rp {parseFloat(value).toLocaleString("id-ID")}</Text>
            )}
          />
          <Table.Column
            title="Jumlah"
            dataIndex="jumlah"
            align="center"
            render={(value) => <Text strong>{value}</Text>}
          />
          <Table.Column
            title="Subtotal"
            dataIndex="subtotal"
            align="right"
            render={(value) => (
              <Text strong>Rp {parseFloat(value).toLocaleString("id-ID")}</Text>
            )}
          />
          <Table.Column
            title="Aksi"
            key="action"
            render={(_, item: any) => {
              // Show refund button if:
              // 1. Order status is 'selesai'
              // 2. Product type is 'kambing'
              // 3. Not yet refunded (isRefunded check - need to ensure backend sends this)
              // 4. Within 7 days

              const canRefund =
                record?.statusPembayaran === "selesai" &&
                item.tipeProduk === "kambing" &&
                !item.isRefunded &&
                isRefundAvailable(record?.tanggalSelesai);

              if (item.isRefunded) {
                return <Tag color="orange">Refunded</Tag>;
              }

              if (canRefund) {
                return (
                  <Button
                    danger
                    size="small"
                    onClick={() => handleRefundClick(item.idOrderDetail)}
                  >
                    Refund
                  </Button>
                );
              }

              return null;
            }}
          />
        </Table>
      </Card>

      <RefundModal
        visible={isRefundModalVisible}
        onCancel={() => setIsRefundModalVisible(false)}
        orderDetailId={selectedOrderDetailId}
        onSuccess={() => {
          // Refresh data
          queryResult.refetch();
        }}
      />
    </Show>
  );
};
