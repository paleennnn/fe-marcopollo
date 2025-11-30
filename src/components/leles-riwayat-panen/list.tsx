"use client";

import React from "react";
import { useTable, List, ShowButton } from "@refinedev/antd";
import { Table, Typography, Tag, Space, Empty, Skeleton } from "antd";
import { HistoryOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

export const RiwayatPanenList = () => {
  const { tableProps, isLoading } = useTable({
    resource: "leles-riwayat-panen",
    syncWithLocation: true,
    pagination: {
      pageSize: 10,
    },
  });

  // ✅ FIX: Handle nested data structure
  let dataSource = [];
  
  if (tableProps?.dataSource) {
    // Jika dataSource adalah object dengan data property
    if (Array.isArray(tableProps.dataSource?.data)) {
      dataSource = tableProps.dataSource.data;
    }
    // Jika dataSource langsung array
    else if (Array.isArray(tableProps.dataSource)) {
      dataSource = tableProps.dataSource;
    }
  }

  console.log("📊 Final dataSource:", dataSource);
  console.log("📊 Data count:", dataSource.length);

  if (isLoading) {
    return (
      <List
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <HistoryOutlined style={{ fontSize: 24, marginRight: 12 }} />
            <Text strong style={{ fontSize: 20 }}>
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
        <div style={{ display: "flex", alignItems: "center" }}>
          <HistoryOutlined style={{ fontSize: 24, marginRight: 12 }} />
          <Text strong style={{ fontSize: 20 }}>
            Riwayat Panen Lele ({dataSource.length} Data)
          </Text>
        </div>
      }
      headerButtons={() => null}
    >
      {dataSource.length === 0 ? (
        <Empty description="Tidak ada data riwayat panen" />
      ) : (
        <Table
          {...tableProps}
          dataSource={dataSource}  // ✅ Gunakan extracted dataSource
          rowKey={(record) => record.idPanen}
          variant="outlined"
          pagination={{
            ...tableProps.pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} data`,
          }}
        >
          <Table.Column
            title="No."
            width={60}
            render={(_, __, index) => {
              const { current = 1, pageSize = 10 } = tableProps.pagination || {};
              return (current - 1) * pageSize + index + 1;
            }}
          />
          <Table.Column
            dataIndex="nomorKolam"
            title="Kolam"
            sorter={(a, b) => a.nomorKolam - b.nomorKolam}
            render={(value) => <Text strong>Kolam {value}</Text>}
          />
          {/* <Table.Column dataIndex="ukuran" title="Ukuran" /> */}
          <Table.Column
            dataIndex="jumlahBibit"
            title="Bibit Awal"
            align="right"
            render={(value) => `${Number(value)?.toLocaleString("id-ID")} ekor`}
          />
          <Table.Column
            dataIndex="jumlahPanen"
            title="Jumlah Panen"
            align="right"
            render={(value) => `${Number(value)?.toLocaleString("id-ID")} ekor`}
          />
          <Table.Column
            dataIndex="totalBeratKg"
            title="Berat Total"
            align="right"
            render={(value) => `${Number(value)?.toLocaleString("id-ID")} kg`}
          />
          <Table.Column
            dataIndex="hargaBeliTotal"
            title="Modal"
            align="right"
            render={(value) => (
              <Text type="secondary">
                Rp {Number(value)?.toLocaleString("id-ID")}
              </Text>
            )}
          />
          <Table.Column
            dataIndex="hargaJualTotal"
            title="Omset"
            align="right"
            render={(value) => (
              <Text strong style={{ color: "#1890ff" }}>
                Rp {Number(value)?.toLocaleString("id-ID")}
              </Text>
            )}
          />
          <Table.Column
            dataIndex="profit"
            title="Profit"
            align="right"
            render={(value) => (
              <Tag color={Number(value) >= 0 ? "green" : "red"}>
                Rp {Number(value)?.toLocaleString("id-ID")}
              </Tag>
            )}
          />
          <Table.Column
            dataIndex="tanggalPanen"
            title="Tanggal Panen"
            sorter={(a, b) =>
              dayjs(a.tanggalPanen).unix() - dayjs(b.tanggalPanen).unix()
            }
            render={(value) => dayjs(value).format("DD MMM YYYY")}
          />
          <Table.Column
            title="Aksi"
            width={100}
            fixed="right"
            render={(_, record: any) => (
              <Space>
                <ShowButton hideText size="small" recordItemId={record.idPanen} />
              </Space>
            )}
          />
        </Table>
      )}
    </List>
  );
};