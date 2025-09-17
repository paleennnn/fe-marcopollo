"use client";

import React from "react";
import { BaseRecord, CanAccess } from "@refinedev/core";
import { useTable, List, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Typography } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import UnauthorizedPage from "@app/unauthorized";

const { Text } = Typography;

export const LeleList = () => {
  const { tableProps } = useTable({
    syncWithLocation: true,
    resource: "leles",
  });

  return (
    <CanAccess resource="leles" action="list" fallback={<UnauthorizedPage />}>
      <List
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <AppstoreOutlined style={{ fontSize: 24, marginRight: 12 }} />
            <Text strong style={{ fontSize: 20 }}>
              Manajemen Lele
            </Text>
          </div>
        }
        headerButtons={({ defaultButtons }) => <>{defaultButtons}</>}
      >
        <Table {...tableProps} rowKey="id" bordered>
          <Table.Column
            title="No."
            width={60}
            render={(_, __, index) => {
              const { current = 1, pageSize = 10 } = tableProps.pagination || {};
              return (current - 1) * pageSize + index + 1;
            }}
          />
          <Table.Column dataIndex="nomorKolam" title="Nomor Kolam" sorter />
          <Table.Column dataIndex="jumlahLele" title="Jumlah Lele" sorter />
          <Table.Column dataIndex="umur" title="Umur" sorter />
          <Table.Column dataIndex="status" title="Status" sorter />

          <Table.Column
            title="Aksi"
            width={180}
            fixed="right"
            render={(_, record: BaseRecord) => (
              <Space>
                <ShowButton hideText size="small" recordItemId={record.id} />
                <EditButton hideText size="small" recordItemId={record.id} />
                <DeleteButton hideText size="small" recordItemId={record.id} />
              </Space>
            )}
          />
        </Table>
      </List>
    </CanAccess>
  );
};
