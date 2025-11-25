"use client";

import { List, useTable } from "@refinedev/antd";
import { Table, Tag, Space, Typography, Card } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const CustomerRefundsList = () => {
  const { tableProps } = useTable({
    resource: "customer/refunds",
    syncWithLocation: true,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "disetujui":
        return "green";
      case "ditolak":
        return "red";
      case "menunggu":
        return "orange";
      default:
        return "default";
    }
  };

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          title="Nomor Order"
          dataIndex={["orderDetail", "order", "nomorOrder"]}
          render={(value) => <Text strong>{value}</Text>}
        />
        <Table.Column
          title="Produk"
          dataIndex={["orderDetail", "namaProduk"]}
        />
        <Table.Column
          title="Total Harga"
          dataIndex="totalHarga"
          render={(value) =>
            new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(parseFloat(value || 0))
          }
        />
        <Table.Column
          title="Tanggal Pengajuan"
          dataIndex="createdAt"
          render={(value) => dayjs(value).format("DD MMM YYYY, HH:mm")}
        />
        <Table.Column title="Alasan" dataIndex="alasan" ellipsis={true} />
        <Table.Column
          title="Status"
          dataIndex="status"
          render={(value) => (
            <Tag color={getStatusColor(value)}>{value.toUpperCase()}</Tag>
          )}
        />
        <Table.Column
          title="Catatan Admin"
          dataIndex="catatanAdmin"
          render={(value) => value || "-"}
        />
      </Table>
    </List>
  );
};
