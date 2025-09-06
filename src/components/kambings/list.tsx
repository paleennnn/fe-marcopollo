"use client";

import React from "react";
import { List, useTable, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Typography, Space, Image } from "antd";
import { useApiUrl } from "@refinedev/core";

const { Title } = Typography;

export const KambingList: React.FC = () => {
  const { tableProps } = useTable({ resource: "kambings" });
  const apiUrl = useApiUrl();

  return (
    <List title={<Title level={4}>Daftar Kambing</Title>}>
      <Table {...tableProps} rowKey="id" bordered>
        <Table.Column title="No." render={(_, __, index) => index + 1} />
        <Table.Column
          dataIndex="image"
          title="Foto"
          render={(value: string) =>
            value ? (
              <Image src={`${apiUrl}/${value}`} width={60} height={60} />
            ) : (
              "-"
            )
          }
        />
        <Table.Column dataIndex="tanggal_ditambahkan" title="Tanggal Ditambahkan" />
        <Table.Column dataIndex="umur" title="Umur (bulan)" />
        <Table.Column dataIndex="keterangan" title="Keterangan" />
        <Table.Column dataIndex="catatan" title="Catatan" />
        <Table.Column
          title="Aksi"
          render={(_, record: any) => (
            <Space>
              <EditButton size="small" recordItemId={record.id} />
              <DeleteButton size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
