"use client";

import React from "react";
import { List, useTable } from "@refinedev/antd";
import { Table, Typography } from "antd";
import { useRouter } from "next/navigation";

const { Title } = Typography;

export const KandangList: React.FC = () => {
  const { tableProps } = useTable({
    resource: "kandangs",
  });

  const router = useRouter();

  return (
    <List
      title={
        <Title level={4} style={{ margin: 0 }}>
          Halaman Kandang
        </Title>
      }
    >
      <Table
        {...tableProps}
        rowKey="id"
        onRow={(record) => ({
          onClick: () => {
            router.push(`/kandangs/show/${record.id}`);
          },
        })}
      >
        <Table.Column dataIndex="no_kandang" title="No Kandang" />
        <Table.Column
          dataIndex="jumlah_kambing"
          title="Jumlah Kambing"
          render={(value: number) => (value === 0 ? "-" : value)}
        />
      </Table>
    </List>
  );
};
