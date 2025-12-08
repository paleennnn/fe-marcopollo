"use client";

import React from "react";
import { useTable, List, ShowButton } from "@refinedev/antd";
import { Table, Typography, Tag, Space, Empty, Skeleton } from "antd";
import { HistoryOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

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
  const { tableProps, isLoading } = useTable({
    resource: "leles-riwayat-panen",
    syncWithLocation: true,
    pagination: {
      pageSize: 10,
    },
  });

  const dataSource = React.useMemo(() => getDataSource(tableProps), [tableProps]);
  const rowCount = dataSource.length;

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
      headerButtons={() => null}
    >
      {rowCount === 0 ? (
        <Empty description="Tidak ada data riwayat panen" />
      ) : (
        <Table
          {...tableProps}
          dataSource={dataSource}
          rowKey="idPanen"
          variant="outlined"
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
                const { current = 1, pageSize = 10 } = tableProps.pagination || {};
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
              render: (value) => `${Number(value || 0).toLocaleString("id-ID")} ekor`,
            },
            {
              dataIndex: "totalBeratKg",
              title: "Berat Total",
              align: "right",
              render: (value) => `${Number(value || 0).toLocaleString("id-ID")} kg`,
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
                  <ShowButton hideText size="small" recordItemId={record.idPanen} />
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