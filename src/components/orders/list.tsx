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
  DatePicker,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import {
  useApiUrl,
  useCustomMutation,
  useInvalidate,
  useDataProvider,
  useNotification,
  type CrudFilters,
} from "@refinedev/core";
import dayjs from "dayjs";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const { Text } = Typography;
const { TextArea } = Input;

type OrderStatus = "semua" | "menunggu_verifikasi" | "selesai" | "ditolak";

export const OrdersList = () => {
  const apiUrl = useApiUrl();
  const dataProvider = useDataProvider();
  const { open } = useNotification();
  const invalidate = useInvalidate();
  const [activeTab, setActiveTab] = useState<OrderStatus>("semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [catatanAdmin, setCatatanAdmin] = useState("");
  const [verifikasiLoading, setVerifikasiLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const { tableProps } = useTable({
    resource: "orders",
    syncWithLocation: true,
    pagination: {
      mode: "off",
    },
    filters: {
      permanent: [
        ...(activeTab !== "semua"
          ? [
              {
                field: "status",
                operator: "eq" as const,
                value: activeTab,
              },
            ]
          : []),
        ...(selectedMonth
          ? [
              {
                field: "tanggalOrder",
                operator: "gte" as const,
                value: selectedMonth.startOf("month").toISOString(),
              },
              {
                field: "tanggalOrder",
                operator: "lte" as const,
                value: selectedMonth.endOf("month").toISOString(),
              },
            ]
          : []),
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

  const handleExport = async (type: "excel" | "pdf") => {
    setExportLoading(true);
    try {
      const filters: CrudFilters = [
        ...(activeTab !== "semua"
          ? [{ field: "status", operator: "eq", value: activeTab }]
          : []),
        ...(selectedMonth
          ? [
              {
                field: "tanggalOrder",
                operator: "gte",
                value: selectedMonth.startOf("month").toISOString(),
              },
              {
                field: "tanggalOrder",
                operator: "lte",
                value: selectedMonth.endOf("month").toISOString(),
              },
            ]
          : []),
      ];

      const { data } = await dataProvider().getList({
        resource: "orders",
        filters,
        pagination: { mode: "off" },
      });

      let orders =
        (data as any)?.data?.data || (data as any)?.data || data || [];
      if (!Array.isArray(orders)) {
        orders = [];
      }

      // Client-side filtering as fallback if backend ignores filters
      if (selectedMonth) {
        const startOfMonth = selectedMonth.startOf("month");
        const endOfMonth = selectedMonth.endOf("month");
        orders = orders.filter((order: any) => {
          const orderDate = dayjs(order.tanggalOrder);
          return (
            orderDate.isSame(startOfMonth, "day") ||
            orderDate.isSame(endOfMonth, "day") ||
            (orderDate.isAfter(startOfMonth) && orderDate.isBefore(endOfMonth))
          );
        });
      }

      if (activeTab !== "semua") {
        orders = orders.filter(
          (order: any) => order.statusPembayaran === activeTab
        );
      }

      if (type === "excel") {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Transaksi");

        worksheet.columns = [
          { header: "No", key: "no", width: 5 },
          { header: "Nomor Order", key: "nomorOrder", width: 20 },
          { header: "Tanggal", key: "tanggal", width: 20 },
          { header: "Customer", key: "customer", width: 30 },
          { header: "Items", key: "items", width: 40 },
          { header: "Total", key: "total", width: 20 },
          { header: "Metode Pembayaran", key: "metode", width: 20 },
          { header: "Status", key: "status", width: 20 },
        ];

        orders.forEach((order: any, index: number) => {
          const items =
            order.orderDetails
              ?.map((item: any) => `${item.namaProduk} (x${item.jumlah})`)
              .join("\n") || "-";

          const row = worksheet.addRow({
            no: index + 1,
            nomorOrder: order.nomorOrder,
            tanggal: dayjs(order.tanggalOrder).format("DD/MM/YYYY HH:mm"),
            customer: order.user?.fullname || "-",
            items: items,
            total: parseFloat(order.totalHarga || 0),
            metode: order.metodePembayaran?.toUpperCase(),
            status: getStatusLabel(order.statusPembayaran),
          });

          // Adjust row height based on number of items (approx 20px per item)
          const itemCount = order.orderDetails?.length || 1;
          row.height = itemCount * 20;

          // Ensure strict alignment for the items cell
          row.getCell("items").alignment = {
            vertical: "top",
            horizontal: "left",
            wrapText: true,
          };
        });

        // Format currency column
        worksheet.getColumn("total").numFmt = '"Rp" #,##0.00';

        // Column configurations
        worksheet.getColumn("items").width = 40;
        worksheet.getColumn("no").alignment = { vertical: "top" };
        worksheet.getColumn("nomorOrder").alignment = { vertical: "top" };
        worksheet.getColumn("tanggal").alignment = { vertical: "top" };
        worksheet.getColumn("customer").alignment = { vertical: "top" };
        worksheet.getColumn("total").alignment = { vertical: "top" };
        worksheet.getColumn("metode").alignment = { vertical: "top" };
        worksheet.getColumn("status").alignment = { vertical: "top" };

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, `Transaksi_${dayjs().format("YYYY-MM-DD_HH-mm")}.xlsx`);
      } else {
        const doc = new jsPDF();

        const tableColumn = [
          "No",
          "Nomor Order",
          "Tanggal",
          "Customer",
          "Items",
          "Total",
          "Metode",
          "Status",
        ];

        const tableRows = orders.map((order: any, index: number) => {
          const items =
            order.orderDetails
              ?.map((item: any) => `${item.namaProduk} (x${item.jumlah})`)
              .join("\n") || "-";

          return [
            index + 1,
            order.nomorOrder,
            dayjs(order.tanggalOrder).format("DD/MM/YYYY HH:mm"),
            order.user?.fullname || "-",
            items,
            `Rp ${parseFloat(order.totalHarga || 0).toLocaleString("id-ID")}`,
            order.metodePembayaran?.toUpperCase(),
            getStatusLabel(order.statusPembayaran),
          ];
        });

        doc.text("Laporan Transaksi", 14, 15);
        if (selectedMonth) {
          doc.text(`Periode: ${selectedMonth.format("MMMM YYYY")}`, 14, 22);
        }

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: selectedMonth ? 25 : 20,
          styles: { fontSize: 8 },
          columnStyles: {
            4: { cellWidth: 40 }, // Width for Items column
          },
        });

        doc.save(`Transaksi_${dayjs().format("YYYY-MM-DD_HH-mm")}.pdf`);
      }
    } catch (error) {
      console.error("Export error:", error);
      open?.({
        type: "error",
        message: "Gagal Export",
        description: "Terjadi kesalahan saat mengexport data",
      });
    } finally {
      setExportLoading(false);
    }
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

  const tabItems = [
    { key: "semua", label: "Semua Transaksi" },
    { key: "dikirim", label: "Sedang Dikirim" },
    { key: "selesai", label: "Selesai" },
    { key: "ditolak", label: "Ditolak" },
  ];

  const dataSource = tableProps.dataSource as any;
  // Handle various potential data structures
  let rawData = dataSource?.data?.data || dataSource?.data || dataSource || [];
  if (!Array.isArray(rawData)) {
    rawData = [];
  }

  // Apply Client-Side Filtering
  let filteredData = rawData;

  if (selectedMonth) {
    const startOfMonth = selectedMonth.startOf("month");
    const endOfMonth = selectedMonth.endOf("month");
    filteredData = filteredData.filter((order: any) => {
      const orderDate = dayjs(order.tanggalOrder);
      return (
        orderDate.isSame(startOfMonth, "day") ||
        orderDate.isSame(endOfMonth, "day") ||
        (orderDate.isAfter(startOfMonth) && orderDate.isBefore(endOfMonth))
      );
    });
  }

  if (activeTab !== "semua") {
    filteredData = filteredData.filter(
      (order: any) => order.statusPembayaran === activeTab
    );
  }

  const safeTableProps = {
    ...tableProps,
    dataSource: filteredData,
    pagination: {
      pageSize: 10,
      total: filteredData.length,
      showTotal: (total: number) => `Total ${total} items`,
    },
  };

  return (
    <>
      <List>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as OrderStatus)}
            items={tabItems}
            style={{ marginBottom: 0, flex: 1 }}
          />
          <Space>
            <DatePicker
              picker="month"
              placeholder="Filter Bulan"
              onChange={(date) => setSelectedMonth(date)}
              value={selectedMonth}
              style={{ width: 150 }}
              allowClear
            />
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => handleExport("excel")}
              loading={exportLoading}
              style={{ backgroundColor: "#217346", color: "white" }}
            >
              Excel
            </Button>
            <Button
              icon={<FilePdfOutlined />}
              onClick={() => handleExport("pdf")}
              loading={exportLoading}
              danger
            >
              PDF
            </Button>
          </Space>
        </div>

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
