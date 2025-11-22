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
  Input,
  Tabs,
} from "antd";
import { CheckOutlined, CloseOutlined, EyeOutlined } from "@ant-design/icons";
import { useApiUrl, useCustomMutation, useInvalidate } from "@refinedev/core";
import { useNotification } from "@refinedev/core";
import dayjs from "dayjs";

const { Text } = Typography;
const { TextArea } = Input;

type OrderStatus = "semua" | "menunggu_verifikasi" | "selesai" | "ditolak";

export const OrdersList = () => {
  const apiUrl = useApiUrl();
  const { open } = useNotification();
  const invalidate = useInvalidate();
  const [activeTab, setActiveTab] = useState<OrderStatus>("semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [catatanAdmin, setCatatanAdmin] = useState("");
  const [verifikasiLoading, setVerifikasiLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { tableProps } = useTable({
    resource: "orders",
    syncWithLocation: true,
    filters: {
      permanent:
        activeTab === "semua"
          ? []
          : [
              {
                field: "status",
                operator: "eq",
                value: activeTab,
              },
            ],
    },
  });

  const { mutate: verifikasiOrder } = useCustomMutation();

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "selesai":
        return "Selesai";
      case "dikirim":
        return "Sedang Dikirim";
      case "menunggu_verifikasi":
        return "Menunggu";
      case "ditolak":
        return "Ditolak";
      default:
        return status;
    }
  };

  const handleVerifikasi = (order: any, status: "selesai" | "ditolak") => {
    setSelectedOrder(order);
    if (status === "ditolak") {
      setIsModalOpen(true);
    } else {
      setIsApproveModalOpen(true);
    }
  };

  const submitVerifikasi = (
    orderId: number,
    status: string,
    catatan: string = ""
  ) => {
    setVerifikasiLoading(true);
    verifikasiOrder(
      {
        url: `${apiUrl}/orders/${orderId}/verifikasi`,
        method: "put",
        values: {
          status: status,
          catatan_admin: catatan || undefined,
        },
      },
      {
        onSuccess: () => {
          setVerifikasiLoading(false);
          setIsModalOpen(false);
          setIsApproveModalOpen(false);
          setCatatanAdmin("");
          setSelectedOrder(null);

          invalidate({
            resource: "orders",
            invalidates: ["list"],
          });

          open?.({
            type: "success",
            message: "Berhasil",
            description: `Order berhasil ${
              status === "dikirim" ? "disetujui dan sedang dikirim" : "ditolak"
            }`,
          });
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

  const handleModalOk = () => {
    if (!catatanAdmin.trim()) {
      open?.({
        type: "error",
        message: "Peringatan",
        description: "Catatan admin harus diisi saat menolak order",
      });
      return;
    }
    submitVerifikasi(selectedOrder.idOrder, "ditolak", catatanAdmin);
  };

  const handleApproveModalOk = () => {
    Modal.confirm({
      title: "Konfirmasi Persetujuan Order",
      content: `Apakah Anda yakin ingin menyetujui order ${selectedOrder?.nomorOrder}? Status akan diubah menjadi "Sedang Dikirim".`,
      okText: "Ya, Setujui & Kirim",
      cancelText: "Batal",
      onOk: () => {
        submitVerifikasi(selectedOrder.idOrder, "dikirim", catatanAdmin);
      },
    });
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setIsApproveModalOpen(false);
    setCatatanAdmin("");
    setSelectedOrder(null);
  };

  const apiData = (tableProps.dataSource as any)?.data?.data || [];
  const safeTableProps = {
    ...tableProps,
    dataSource: Array.isArray(apiData) ? apiData : [],
    pagination: {
      ...tableProps.pagination,
      total: (tableProps.dataSource as any)?.data?.meta?.total || 0,
    },
  };

  const tabItems = [
    { key: "semua", label: "Semua Transaksi" },
    { key: "menunggu_verifikasi", label: "Menunggu" },
    { key: "dikirim", label: "Sedang Dikirim" },
    { key: "selesai", label: "Selesai" },
    { key: "ditolak", label: "Ditolak" },
  ];

  return (
    <>
      <List>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as OrderStatus)}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />

        <Table {...safeTableProps} rowKey="idOrder">
          <Table.Column
            dataIndex="nomorOrder"
            title="Nomor Order"
            render={(value) => <Text strong>{value}</Text>}
          />
          <Table.Column
            dataIndex="user"
            title="Customer"
            render={(user) => (
              <div>
                <Text strong>{user?.fullname || "-"}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {user?.email || "-"}
                </Text>
              </div>
            )}
          />
          <Table.Column
            dataIndex="tanggalOrder"
            title="Tanggal Order"
            render={(value) => dayjs(value).format("DD MMM YYYY HH:mm")}
          />
          <Table.Column
            dataIndex="totalHarga"
            title="Total"
            align="right"
            render={(value) => (
              <Text strong>Rp {parseFloat(value).toLocaleString("id-ID")}</Text>
            )}
          />
          <Table.Column
            dataIndex="metodePembayaran"
            title="Metode"
            render={(value) => <Tag color="blue">{value?.toUpperCase()}</Tag>}
          />
          <Table.Column
            dataIndex="buktiPembayaran"
            title="Bukti"
            render={(value, record: any) =>
              value ? (
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() =>
                    setPreviewImage(
                      `${apiUrl}/storage/uploads/bukti_pembayaran/${value}`
                    )
                  }
                >
                  Lihat
                </Button>
              ) : record.metodePembayaran === "tunai" ? (
                <Tag color="gold">Tunai</Tag>
              ) : (
                <Text type="secondary">Belum Upload</Text>
              )
            }
          />
          <Table.Column
            dataIndex="statusPembayaran"
            title="Status"
            render={(value) => (
              <Tag color={getStatusColor(value)}>{getStatusLabel(value)}</Tag>
            )}
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
            fixed="right"
            width={200}
            render={(_, record: any) => (
              <Space>
                <ShowButton
                  hideText
                  size="small"
                  recordItemId={record.idOrder}
                />
                {record.statusPembayaran === "menunggu_verifikasi" && (
                  <>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleVerifikasi(record, "selesai")}
                    >
                      Terima
                    </Button>
                    <Button
                      danger
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => handleVerifikasi(record, "ditolak")}
                    >
                      Tolak
                    </Button>
                  </>
                )}
              </Space>
            )}
          />
        </Table>
      </List>

      {/* Modal Tolak Order */}
      <Modal
        title="Tolak Order"
        open={isModalOpen}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
        okText="Tolak Order"
        cancelText="Batal"
        okButtonProps={{ danger: true, loading: verifikasiLoading }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Nomor Order: </Text>
          <Text>{selectedOrder?.nomorOrder}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Customer: </Text>
          <Text>{selectedOrder?.user?.fullname}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Total: </Text>
          <Text>
            Rp{" "}
            {parseFloat(selectedOrder?.totalHarga || 0).toLocaleString("id-ID")}
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
          <Text>{selectedOrder?.nomorOrder}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Customer: </Text>
          <Text>{selectedOrder?.user?.fullname}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Total: </Text>
          <Text>
            Rp{" "}
            {parseFloat(selectedOrder?.totalHarga || 0).toLocaleString("id-ID")}
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
    </>
  );
};
