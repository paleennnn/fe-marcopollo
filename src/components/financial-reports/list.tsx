"use client";

import {
  List,
  useTable,
  DateField,
  TextField,
  NumberField,
} from "@refinedev/antd";
import { useNavigation, useGo, useList } from "@refinedev/core";
import {
  Table,
  Tabs,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Statistic,
  DatePicker,
  Button,
} from "antd";
import {
  DollarCircleOutlined,
  ShoppingOutlined,
  HistoryOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const { Text, Title } = Typography;

export const FinancialReportsList = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(null);

  const { tableProps } = useTable({
    resource: "orders",
    pagination: {
      pageSize: 10000,
      mode: "server",
    },
    filters: {
      permanent: [
        {
          field: "status",
          operator: "eq",
          value: "selesai",
        },
      ],
    },
    syncWithLocation: false,
  });

  // Fetch Lele Harvests
  const { data: leleData } = useList({
    resource: "leles-riwayat-panen",
    pagination: {
      pageSize: 10000,
      mode: "server",
    },
  });

  const dataSource = tableProps.dataSource as any;
  const rawOrders =
    dataSource?.data?.data || dataSource?.data || dataSource || [];

  const leleList: any[] = Array.isArray(leleData?.data) ? leleData.data : [];

  const leleOrders = leleList.map((item: any) => ({
    idOrder: `PANEN-${item.idPanen}`,
    nomorOrder: `PANEN-${item.nomorKolam}-${dayjs(item.tanggalPanen).format(
      "DMY"
    )}`,
    tanggalOrder: item.tanggalPanen,
    totalHarga: item.hargaJualTotal,
    user: { fullname: "Internal (Panen)" },
    orderDetails: [
      {
        namaProduk: `Panen Lele Kolam ${item.nomorKolam} (${item.totalBeratKg}kg)`,
        tipeProduk: "lele",
        jumlah: 1,
        hargaSatuan: item.hargaJualTotal,
      },
    ],
    status: "selesai",
  }));

  const allOrders = [...rawOrders, ...leleOrders].sort(
    (a, b) => dayjs(b.tanggalOrder).valueOf() - dayjs(a.tanggalOrder).valueOf()
  );

  const processData = useMemo(() => {
    let _orders = Array.isArray(allOrders) ? [...allOrders] : [];

    // Filter by month
    if (selectedMonth) {
      const startOfMonth = selectedMonth.startOf("month");
      const endOfMonth = selectedMonth.endOf("month");
      
      _orders = _orders.filter((order: any) => {
        const orderDate = dayjs(order.tanggalOrder);
        return (
          orderDate.isSame(startOfMonth, "day") ||
          orderDate.isSame(endOfMonth, "day") ||
          (orderDate.isAfter(startOfMonth) && orderDate.isBefore(endOfMonth))
        );
      });
    }

    // Filter by category
    if (activeTab !== "all") {
      _orders = _orders.filter((order: any) => {
        return order.orderDetails?.some(
          (detail: any) => detail.tipeProduk === activeTab
        );
      });
    }

    const totalIncome = _orders.reduce(
      (sum: number, order: any) => sum + parseFloat(order.totalHarga || 0),
      0
    );

    const totalTransactions = _orders.length;

    return {
      orders: _orders,
      totalIncome,
      totalTransactions,
    };
  }, [allOrders, activeTab, selectedMonth]);

  const handleExport = async (type: "excel" | "pdf") => {
    setExportLoading(true);
    try {
      const dataToExport = processData.orders;
      const monthText = selectedMonth
        ? ` - ${selectedMonth.format("MMMM YYYY")}`
        : "";
      const title = `Laporan Keuangan - ${
        activeTab === "all"
          ? "Semua"
          : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
      }${monthText}`;

      if (type === "excel") {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Laporan");

        worksheet.columns = [
          { header: "No", key: "no", width: 5 },
          { header: "Nomor Order", key: "nomorOrder", width: 20 },
          { header: "Tanggal", key: "tanggal", width: 20 },
          { header: "Customer", key: "customer", width: 30 },
          { header: "Items", key: "items", width: 40 },
          { header: "Total", key: "total", width: 20 },
        ];

        dataToExport.forEach((order: any, index: number) => {
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
          });

          const itemCount = order.orderDetails?.length || 1;
          row.height = itemCount * 20;

          row.getCell("items").alignment = {
            vertical: "top",
            horizontal: "left",
            wrapText: true,
          };
        });

        worksheet.getColumn("total").numFmt = '"Rp" #,##0.00';

        worksheet.getColumn("items").width = 40;
        worksheet.getColumn("no").alignment = { vertical: "top" };
        worksheet.getColumn("nomorOrder").alignment = { vertical: "top" };
        worksheet.getColumn("tanggal").alignment = { vertical: "top" };
        worksheet.getColumn("customer").alignment = { vertical: "top" };
        worksheet.getColumn("total").alignment = { vertical: "top" };

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(
          blob,
          `Laporan_Keuangan_${dayjs().format("YYYY-MM-DD_HH-mm")}.xlsx`
        );
      } else {
        const doc = new jsPDF();

        const tableColumn = [
          "No",
          "Nomor Order",
          "Tanggal",
          "Customer",
          "Items",
          "Total",
        ];

        const tableRows = dataToExport.map((order: any, index: number) => {
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
          ];
        });

        doc.text(title, 14, 15);
        if (selectedMonth) {
          doc.text(`Periode: ${selectedMonth.format("MMMM YYYY")}`, 14, 22);
        }
        doc.text(
          `Total Omset: Rp ${processData.totalIncome.toLocaleString("id-ID")}`,
          14,
          selectedMonth ? 29 : 22
        );
        doc.text(
          `Total Transaksi: ${processData.totalTransactions}`,
          14,
          selectedMonth ? 36 : 29
        );

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: selectedMonth ? 42 : 35,
          styles: { fontSize: 8 },
          columnStyles: {
            4: { cellWidth: 50 },
          },
        });

        doc.save(`Laporan_Keuangan_${dayjs().format("YYYY-MM-DD_HH-mm")}.pdf`);
      }
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExportLoading(false);
    }
  };

  const tabItems = [
    { key: "all", label: "Semua" },
    { key: "kambing", label: "Kambing" },
    { key: "material", label: "Material" },
    { key: "lele", label: "Lele" },
  ];

  return (
    <List
      title="Laporan Keuangan"
      headerButtons={
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
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Total Omset"
              value={processData.totalIncome}
              prefix={<DollarCircleOutlined />}
              precision={0}
              formatter={(value) =>
                `Rp ${Number(value).toLocaleString("id-ID")}`
              }
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Total Transaksi Selesai"
              value={processData.totalTransactions}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ width: "100%" }}
        tabList={tabItems}
        activeTabKey={activeTab}
        onTabChange={(key) => setActiveTab(key)}
      >
        <Table
          dataSource={processData.orders}
          rowKey="idOrder"
          pagination={{ 
            pageSize: 10,
            showTotal: (total: number) => `Total ${total} transaksi`,
          }}
        >
          <Table.Column
            dataIndex="nomorOrder"
            title="Nomor Order"
            render={(value) => <Text strong>{value}</Text>}
          />
          <Table.Column
            dataIndex="tanggalOrder"
            title="Tanggal"
            render={(value) => dayjs(value).format("DD MMM YYYY HH:mm")}
          />
          <Table.Column
            dataIndex="user"
            title="Customer"
            render={(user: any) => user?.fullname || "-"}
          />
          <Table.Column
            title="Items"
            render={(_, record: any) => (
              <Space direction="vertical" size={0}>
                {record.orderDetails?.map((detail: any, idx: number) => (
                  <Text key={idx} style={{ fontSize: 12 }}>
                    {detail.namaProduk} (x{detail.jumlah}){" "}
                    <Tag
                      color={
                        detail.tipeProduk === "material"
                          ? "blue"
                          : detail.tipeProduk === "kambing"
                          ? "orange"
                          : "green"
                      }
                    >
                      {detail.tipeProduk}
                    </Tag>
                  </Text>
                ))}
              </Space>
            )}
          />
          <Table.Column
            dataIndex="totalHarga"
            title="Total"
            align="right"
            render={(value) => (
              <Text strong>Rp {parseFloat(value).toLocaleString("id-ID")}</Text>
            )}
          />
        </Table>
      </Card>
    </List>
  );
};