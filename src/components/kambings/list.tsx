"use client";

import React from "react";
import { BaseRecord, CanAccess, useApiUrl } from "@refinedev/core";
import { useTable, List, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Typography, Image } from "antd";
import { ThunderboltFilled } from "@ant-design/icons";
import UnauthorizedPage from "@app/unauthorized";

const { Text } = Typography;

export const KambingList = () => {
  const apiUrl = useApiUrl();

  const { tableProps } = useTable({
    syncWithLocation: true,
    resource: "kambings",
  });

  return (
    <CanAccess resource="kambings" action="list" fallback={<UnauthorizedPage />}>
      <List
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <ThunderboltFilled style={{ fontSize: 24, marginRight: 12 }} />
            <Text strong style={{ fontSize: 20 }}>
              Manajemen Kambing
            </Text>
          </div>
        } 
        headerButtons={({ defaultButtons }) => <>{defaultButtons}</>}
      >
        <Table {...tableProps} rowKey="id" bordered>
          {/* Nomor urut */}
          <Table.Column
            title="No."
            width={60}
            render={(_, __, index) => {
              const { current = 1, pageSize = 10 } = tableProps.pagination || {};
              return (current - 1) * pageSize + index + 1;
            }}
          />

          {/* Nama Kambing */}
          <Table.Column
            dataIndex="namaKambing"
            title="Nama Kambing"
            sorter
            render={(value: string) => <Text strong>{value}</Text>}
          />

          {/* Umur */}
          <Table.Column
            dataIndex="umur"
            title="Umur (bulan)"
            sorter
            render={(value: number) => <Text>{value} bulan</Text>}
          />

          {/* Harga */}
          <Table.Column
            dataIndex="harga"
            title="Harga"
            sorter
            render={(value: number) => (
              <Text>Rp {value?.toLocaleString("id-ID")}</Text>
            )}
          />

          {/* Gambar */}
          <Table.Column
            dataIndex="image"
            title="Foto"
            render={(value: string) =>
              value ? (
                <Image
                  src={`${apiUrl}/${value}`}
                  alt="Kambing"
                  width={60}
                  height={60}
                  style={{ objectFit: "cover", borderRadius: 8 }}
                />
              ) : (
                <Text type="secondary">Tidak ada foto</Text>
              )
            }
          />

          {/* Aksi */}
          <Table.Column
            title="Aksi"
            width={180}
            fixed="right"
            render={(_, record: BaseRecord) => (
              <Space>
                <ShowButton hideText size="small" recordItemId={record.id} />
                <EditButton hideText size="small" recordItemId={record.id} title="Edit kambing" />
                <DeleteButton hideText size="small" recordItemId={record.id} title="Hapus kambing" />
              </Space>
            )}
          />
        </Table>
      </List>
    </CanAccess>
  );
};
