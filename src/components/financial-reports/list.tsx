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
const { RangePicker } = DatePicker;

export const FinancialReportsList = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [exportLoading, setExportLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

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

  // Fetch all materials
  const { data: materialsData } = useList({
    resource: "materials",
    pagination: {
      pageSize: 10000,
      mode: "server",
    },
  });

  // Fetch all kambings
  const { data: kambingsData } = useList({
    resource: "kambings",
    pagination: {
      pageSize: 10000,
      mode: "server",
    },
  });

  const dataSource = tableProps.dataSource as any;
  const rawOrders =
    dataSource?.data?.data || dataSource?.data || dataSource || [];

  const leleList: any[] = Array.isArray(leleData?.data) ? leleData.data : [];
  const materialsList: any[] = Array.isArray(materialsData?.data) ? materialsData.data : [];
  const kambingsList: any[] = Array.isArray(kambingsData?.data) ? kambingsData.data : [];

  // Helper function to get modal per order
  const getOrderModal = (order: any) => {
    if (order.modal !== undefined) return order.modal; // For lele

    // Calculate modal from orderDetails
    return order.orderDetails?.reduce((sum: number, detail: any) => {
      let hargaBeli = 0;

      if (detail.tipeProduk === "material") {
        const material = materialsList.find(
          (m: any) => m.id === detail.idMaterial || m.id_material === detail.idMaterial
        );
        hargaBeli = Number(material?.hargaBeli || material?.harga_beli || 0);
      } else if (detail.tipeProduk === "kambing") {
        const kambing = kambingsList.find(
          (k: any) => k.id === detail.idKambing || k.id_kambing === detail.idKambing
        );
        hargaBeli = Number(kambing?.hargaBeli || kambing?.harga_beli || 0);
      }

      return sum + hargaBeli * (detail.jumlah || 1);
    }, 0) || 0;
  };

  const leleOrders = leleList.map((item: any) => {
    const modal = (Number(item.hargaBeliTotal || item.harga_beli_total || 0) + Number(item.potongPakan || item.potong_pakan || 0));
    const omset = Number(item.hargaJualTotal || item.harga_jual_total || 0);
    return {
      idOrder: `PANEN-${item.idPanen || item.id_panen}`,
      nomorOrder: `PANEN-${item.nomorKolam || item.nomor_kolam}-${dayjs(item.tanggalPanen || item.tanggal_panen).format("DMY")}`,
      tanggalOrder: item.tanggalPanen || item.tanggal_panen,
      totalHarga: omset,
      modal: modal,
      user: { fullname: "Internal (Panen)" },
      orderDetails: [
        {
          namaProduk: `Panen Lele Kolam ${item.nomorKolam || item.nomor_kolam} (${item.totalBeratKg || item.total_berat_kg}kg)`,
          tipeProduk: "lele",
          jumlah: 1,
          hargaSatuan: omset,
          hargaBeli: modal,
        },
      ],
      status: "selesai",
    };
  });

  const allOrders = [...rawOrders, ...leleOrders].sort(
    (a, b) => dayjs(b.tanggalOrder).valueOf() - dayjs(a.tanggalOrder).valueOf()
  );

  const processData = useMemo(() => {
    let _orders = Array.isArray(allOrders) ? [...allOrders] : [];

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf("day");
      const endDate = dateRange[1].endOf("day");
      
      _orders = _orders.filter((order: any) => {
        const orderDate = dayjs(order.tanggalOrder);
        return (
          orderDate.isSame(startDate, "day") ||
          orderDate.isSame(endDate, "day") ||
          (orderDate.isAfter(startDate) && orderDate.isBefore(endDate))
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

    const totalModal = _orders.reduce((sum: number, order: any) => {
      return sum + getOrderModal(order);
    }, 0);

    const totalProfit = totalIncome - totalModal;
    const totalTransactions = _orders.length;

    return {
      orders: _orders,
      totalIncome,
      totalModal,
      totalProfit,
      totalTransactions,
    };
  }, [allOrders, activeTab, dateRange]);

  const handleExport = async (type: "excel" | "pdf") => {
    setExportLoading(true);
    try {
      const dataToExport = processData.orders;
      const dateText = dateRange && dateRange[0] && dateRange[1]
        ? ` - ${dateRange[0].format("DD MMM YYYY")} hingga ${dateRange[1].format("DD MMM YYYY")}`
        : "";
      const title = `Laporan Keuangan - ${
        activeTab === "all"
          ? "Semua"
          : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
      }${dateText}`;

      if (type === "excel") {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Laporan");

        worksheet.columns = [
          { header: "No", key: "no", width: 5 },
          { header: "Tanggal", key: "tanggal", width: 20 },
          { header: "Customer", key: "customer", width: 30 },
          { header: "Items", key: "items", width: 40 },
          { header: "Modal", key: "modal", width: 20 },
          { header: "Omset", key: "omset", width: 20 },
          { header: "Profit", key: "profit", width: 20 },
        ];

        dataToExport.forEach((order: any, index: number) => {
          const items =
            order.orderDetails
              ?.map((item: any) => `${item.namaProduk} (x${item.jumlah})`)
              .join("\n") || "-";

          const orderModal = getOrderModal(order);
          const profit = parseFloat(order.totalHarga || 0) - orderModal;

          const row = worksheet.addRow({
            no: index + 1,
            tanggal: dayjs(order.tanggalOrder).format("DD/MM/YYYY HH:mm"),
            customer: order.user?.fullname || "-",
            items: items,
            modal: orderModal,
            omset: parseFloat(order.totalHarga || 0),
            profit: profit,
          });

          const itemCount = order.orderDetails?.length || 1;
          row.height = itemCount * 20;

          row.getCell("items").alignment = {
            vertical: "top",
            horizontal: "left",
            wrapText: true,
          };
        });

        // Add total row
        const totalRow = worksheet.addRow({
          no: "",
          tanggal: "",
          customer: "",
          items: "",
          modal: processData.totalModal,
          omset: processData.totalIncome,
          profit: processData.totalProfit,
        });
        totalRow.font = { bold: true };
        totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEB3B" } };

        worksheet.getColumn("modal").numFmt = '"Rp" #,##0';
        worksheet.getColumn("omset").numFmt = '"Rp" #,##0';
        worksheet.getColumn("profit").numFmt = '"Rp" #,##0';

        worksheet.getColumn("items").width = 40;
        worksheet.getColumn("no").alignment = { vertical: "top" };
        worksheet.getColumn("tanggal").alignment = { vertical: "top" };
        worksheet.getColumn("customer").alignment = { vertical: "top" };
        worksheet.getColumn("modal").alignment = { vertical: "top" };
        worksheet.getColumn("omset").alignment = { vertical: "top" };
        worksheet.getColumn("profit").alignment = { vertical: "top" };

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

        // Header - Marcopollo Group
        doc.setFontSize(14);
        doc.text("Marcopollo Group", 105, 12, { align: "center" });
        
        // Title - Laporan Keuangan
        doc.setFontSize(12);
        doc.text("Laporan Keuangan", 105, 19, { align: "center" });

        // Summary info with smaller font
        doc.setFontSize(9);
        let summaryY = 26;
        doc.text(`Kategori: ${activeTab === "all" ? "Semua" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`, 14, summaryY);
        
        if (dateRange && dateRange[0] && dateRange[1]) {
          summaryY += 5;
          doc.text(`Periode: ${dateRange[0].format("DD MMM YYYY")} - ${dateRange[1].format("DD MMM YYYY")}`, 14, summaryY);
        }
        
        summaryY += 5;
        doc.text(`Total Transaksi: ${processData.totalTransactions}`, 14, summaryY);

        const tableColumn = [
          "No",
          "Tanggal",
          "Customer",
          "Items",
          "Modal (Rp)",
          "Omset (Rp)",
          "Profit (Rp)",
        ];

        const tableRows = dataToExport.map((order: any, index: number) => {
          const items =
            order.orderDetails
              ?.map((item: any) => `${item.namaProduk} (x${item.jumlah})`)
              .join("\n") || "-";

          const orderModal = getOrderModal(order);
          const profit = parseFloat(order.totalHarga || 0) - orderModal;

          return [
            index + 1,
            dayjs(order.tanggalOrder).format("DD/MM/YYYY HH:mm"),
            order.user?.fullname || "-",
            items,
            orderModal.toLocaleString("id-ID"),
            parseFloat(order.totalHarga || 0).toLocaleString("id-ID"),
            profit.toLocaleString("id-ID"),
          ];
        });

        // Add total row at the end
        tableRows.push([
          "",
          "TOTAL",
          "",
          "",
          processData.totalModal.toLocaleString("id-ID"),
          processData.totalIncome.toLocaleString("id-ID"),
          processData.totalProfit.toLocaleString("id-ID"),
        ]);

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: summaryY + 8,
          styles: { fontSize: 8 },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          columnStyles: {
            4: { cellWidth: 50 },
          },
          didParseCell: (data) => {
            // Style the last row (TOTAL) with blue background
            if (data.row.index === data.table.body.length - 1) {
              data.cell.styles.fillColor = [41, 128, 185];
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = 'bold';
            }
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
          <RangePicker
            placeholder={["Start date", "End date"]}
            onChange={(dates: [Dayjs | null, Dayjs | null] | null) => setDateRange(dates)}
            value={dateRange}
            style={{ width: 260 }}
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
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Modal"
              value={processData.totalModal}
              prefix={<DollarCircleOutlined />}
              precision={0}
              formatter={(value) =>
                `Rp ${Number(value).toLocaleString("id-ID")}`
              }
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
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
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Profit"
              value={processData.totalProfit}
              prefix={<DollarCircleOutlined />}
              precision={0}
              formatter={(value) =>
                `Rp ${Number(value).toLocaleString("id-ID")}`
              }
              valueStyle={{ color: processData.totalProfit >= 0 ? "#1890ff" : "#ff4d4f" }}
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
                  <Text key={`${record.id_order || record.id}-${idx}`} style={{ fontSize: 12 }}>
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
            title="Modal"
            align="right"
            render={(_, record: any) => {
              const orderModal = getOrderModal(record);
              return (
                <Text>Rp {Number(orderModal).toLocaleString("id-ID")}</Text>
              );
            }}
          />
          <Table.Column
            dataIndex="totalHarga"
            title="Omset"
            align="right"
            render={(value) => (
              <Text strong>Rp {Number(value || 0).toLocaleString("id-ID")}</Text>
            )}
          />
          <Table.Column
            title="Profit"
            align="right"
            render={(_, record: any) => {
              const orderModal = getOrderModal(record);
              const profit = Number(record.totalHarga || 0) - Number(orderModal);
              return (
                <Text strong style={{ color: profit >= 0 ? "#3f8600" : "#ff4d4f" }}>
                  Rp {Number(profit).toLocaleString("id-ID")}
                </Text>
              );
            }}
          />
        </Table>
      </Card>
    </List>
  );
};