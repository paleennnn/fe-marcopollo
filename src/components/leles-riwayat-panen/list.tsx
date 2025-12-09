"use client";

import React, { useState } from "react";
import { useTable, List, ShowButton } from "@refinedev/antd";
import { useDataProvider } from "@refinedev/core";
import { Table, Typography, Tag, Space, Empty, Skeleton, Button } from "antd";
import {
  HistoryOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const { Text } = Typography;

const getDataSource = (tableProps: any): any[] => {
  if (!tableProps?.dataSource) return [];

  if (Array.isArray(tableProps.dataSource?.data)) {
    return tableProps.dataSource.data;
  }

  if (Array.isArray(tableProps.dataSource)) {
    return tableProps.dataSource;
  }

  return [];
};

const calculateProfit = (record: any): number => {
  const omset = Number(record.hargaJualTotal) || 0;
  const hargaBeli = Number(record.hargaBeliTotal) || 0;
  const potongPakan = Number(record.potongPakan) || 0;
  return omset - (hargaBeli + potongPakan);
};

const renderProfit = (record: any) => {
  const profit = calculateProfit(record);
  return (
    <Tag color={profit >= 0 ? "green" : "red"}>
      Rp {profit.toLocaleString("id-ID")}
    </Tag>
  );
};

export const RiwayatPanenList = () => {
  const { tableProps, tableQueryResult } = useTable({
    resource: "leles-riwayat-panen",
    syncWithLocation: true,
    pagination: {
      pageSize: 10,
    },
  });

  const isLoading = tableQueryResult?.isLoading || false;

  const dataProvider = useDataProvider();
  const [exportLoading, setExportLoading] = useState(false);

  const dataSource = React.useMemo(
    () => getDataSource(tableProps),
    [tableProps]
  );
  const rowCount = dataSource.length;

  const handleExport = async (type: "excel" | "pdf") => {
    setExportLoading(true);
    try {
      // Fetch all data for export
      const { data } = await dataProvider().getList({
        resource: "leles-riwayat-panen",
        pagination: { mode: "off" },
      });

      const allData = (data as any)?.data || data || [];
      const title = "Riwayat Panen Lele";

      if (type === "excel") {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Riwayat Panen");

        worksheet.columns = [
          { header: "No", key: "no", width: 5 },
          { header: "Kolam", key: "kolam", width: 10 },
          { header: "Bibit Awal", key: "bibit", width: 15 },
          { header: "Berat Total", key: "berat", width: 15 },
          { header: "Modal", key: "modal", width: 20 },
          { header: "Potong Pakan", key: "pakan", width: 20 },
          { header: "Omset", key: "omset", width: 20 },
          { header: "Profit", key: "profit", width: 20 },
          { header: "Tanggal Panen", key: "tanggal", width: 20 },
        ];

        allData.forEach((item: any, index: number) => {
          worksheet.addRow({
            no: index + 1,
            kolam: `Kolam ${item.nomorKolam}`,
            bibit: Number(item.jumlahBibit || 0),
            berat: `${Number(item.totalBeratKg || 0)} kg`,
            modal: Number(item.hargaBeliTotal || 0),
            pakan: Number(item.potongPakan || 0),
            omset: Number(item.hargaJualTotal || 0),
            profit: calculateProfit(item),
            tanggal: dayjs(item.tanggalPanen).format("DD/MM/YYYY"),
          });
        });

        // Format currency columns
        const currencyCols = ["modal", "pakan", "omset", "profit"];
        currencyCols.forEach((colKey) => {
          worksheet.getColumn(colKey).numFmt = '"Rp" #,##0';
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, `Riwayat_Panen_${dayjs().format("YYYY-MM-DD")}.xlsx`);
      } else {
        const doc = new jsPDF();
        const tableColumn = [
          "No",
          "Kolam",
          "Bibit",
          "Berat",
          "Modal",
          "Pakan",
          "Omset",
          "Profit",
          "Tanggal",
        ];

        const tableRows = allData.map((item: any, index: number) => [
          index + 1,
          `Kolam ${item.nomorKolam}`,
          Number(item.jumlahBibit || 0).toLocaleString("id-ID"),
          `${Number(item.totalBeratKg || 0)} kg`,
          `Rp ${Number(item.hargaBeliTotal || 0).toLocaleString("id-ID")}`,
          `Rp ${Number(item.potongPakan || 0).toLocaleString("id-ID")}`,
          `Rp ${Number(item.hargaJualTotal || 0).toLocaleString("id-ID")}`,
          `Rp ${calculateProfit(item).toLocaleString("id-ID")}`,
          dayjs(item.tanggalPanen).format("DD/MM/YYYY"),
        ]);

        doc.text(title, 14, 15);
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 20,
          styles: { fontSize: 8 },
        });

        doc.save(`Riwayat_Panen_${dayjs().format("YYYY-MM-DD")}.pdf`);
      }
    } catch (error) {
      console.error("Export Error:", error);
    } finally {
      setExportLoading(false);
    }
  };

  if (isLoading) {
    return (
      <List
        title={
          <div style={styles.titleContainer}>
            <HistoryOutlined style={styles.titleIcon} />
            <Text strong style={styles.titleText}>
              Loading...
            </Text>
          </div>
        }
        headerButtons={() => null}
      >
        <Skeleton active paragraph={{ rows: 5 }} />
      </List>
    );
  }

  return (
    <List
      title={
        <div style={styles.titleContainer}>
          <HistoryOutlined style={styles.titleIcon} />
          <Text strong style={styles.titleText}>
            Riwayat Panen Lele ({rowCount} Data)
          </Text>
        </div>
      }
      headerButtons={() => (
        <Space>
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
      )}
    >
      {rowCount === 0 ? (
        <Empty description="Tidak ada data riwayat panen" />
      ) : (
        <Table
          {...tableProps}
          dataSource={dataSource}
          rowKey="idPanen"
          pagination={{
            ...tableProps.pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} data`,
          }}
          columns={[
            {
              title: "No.",
              width: 60,
              render: (_, __, index) => {
                const { current = 1, pageSize = 10 } =
                  tableProps.pagination || {};
                return (current - 1) * pageSize + index + 1;
              },
            },
            {
              dataIndex: "nomorKolam",
              title: "Kolam",
              sorter: (a, b) => a.nomorKolam - b.nomorKolam,
              render: (value) => <Text strong>Kolam {value}</Text>,
            },
            {
              dataIndex: "jumlahBibit",
              title: "Bibit Awal",
              align: "right",
              render: (value) =>
                `${Number(value || 0).toLocaleString("id-ID")} ekor`,
            },
            {
              dataIndex: "totalBeratKg",
              title: "Berat Total",
              align: "right",
              render: (value) =>
                `${Number(value || 0).toLocaleString("id-ID")} kg`,
            },
            {
              dataIndex: "hargaBeliTotal",
              title: "Modal",
              align: "right",
              render: (value) => (
                <Text type="secondary">
                  Rp {Number(value || 0).toLocaleString("id-ID")}
                </Text>
              ),
            },
            {
              dataIndex: "potongPakan",
              title: "Potong Pakan",
              align: "right",
              render: (value) => (
                <Text type="warning">
                  Rp {Number(value || 0).toLocaleString("id-ID")}
                </Text>
              ),
            },
            {
              dataIndex: "hargaJualTotal",
              title: "Omset",
              align: "right",
              render: (value) => (
                <Text strong style={{ color: "#1890ff" }}>
                  Rp {Number(value || 0).toLocaleString("id-ID")}
                </Text>
              ),
            },
            {
              dataIndex: "profit",
              title: "Profit",
              align: "right",
              sorter: (a, b) => calculateProfit(a) - calculateProfit(b),
              render: (_, record) => renderProfit(record),
            },
            {
              dataIndex: "tanggalPanen",
              title: "Tanggal Panen",
              sorter: (a, b) =>
                dayjs(a.tanggalPanen).unix() - dayjs(b.tanggalPanen).unix(),
              render: (value) => dayjs(value).format("DD MMM YYYY"),
            },
            {
              title: "Aksi",
              width: 100,
              fixed: "right",
              render: (_, record) => (
                <Space>
                  <ShowButton
                    hideText
                    size="small"
                    recordItemId={record.idPanen}
                  />
                </Space>
              ),
            },
          ]}
        />
      )}
    </List>
  );
};

const styles = {
  titleContainer: {
    display: "flex",
    alignItems: "center",
  },
  titleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  titleText: {
    fontSize: 20,
  },
} as const;
