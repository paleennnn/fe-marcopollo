"use client";

import React from "react";
import { BaseRecord, CanAccess, useApiUrl } from "@refinedev/core";
import { useTable, List, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Typography, Image } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import UnauthorizedPage from "@app/unauthorized";

const { Text } = Typography;

export const MaterialList = () => {
  const apiUrl = useApiUrl();

  const { tableProps } = useTable({
    syncWithLocation: true,
    resource: "materials",
  });

  return (
    <CanAccess resource="materials" action="list" fallback={<UnauthorizedPage />}>
      <List
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <AppstoreOutlined style={{ fontSize: 24, marginRight: 12 }} />
            <Text strong style={{ fontSize: 20 }}>
              Manajemen Material
            </Text>
          </div>
        }
        headerButtons={({ defaultButtons }) => <>{defaultButtons}</>}
      >
        <Table {...tableProps} rowKey="id_material" bordered>
          {/* Nomor urut */}
          <Table.Column
            title="No."
            width={60}
            render={(_, __, index) => {
              const { current = 1, pageSize = 10 } = tableProps.pagination || {};
              return (current - 1) * pageSize + index + 1;
            }}
          />

          {/* Nama Material */}
          <Table.Column
            dataIndex="nama_material"
            title="Nama Material"
            sorter
            render={(value: string) => <Text strong>{value}</Text>}
          />

          {/* Harga Satuan */}
          <Table.Column
            dataIndex="harga_satuan"
            title="Harga Satuan"
            sorter
            render={(value: number) => (
              <Text>
                Rp {value?.toLocaleString("id-ID")}
              </Text>
            )}
          />

          {/* Gambar */}
          <Table.Column
            dataIndex="image"
            title="Gambar"
            render={(value: string) =>
              value ? (
                <Image
                  src={`${apiUrl}/${value}`}
                  alt="Material"
                  width={60}
                  height={60}
                  style={{ objectFit: "cover", borderRadius: 8 }}
                />
              ) : (
                <Text type="secondary">Tidak ada gambar</Text>
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
                <ShowButton hideText size="small" recordItemId={record.id_material} />
                <EditButton hideText size="small" recordItemId={record.id_material} />
                <DeleteButton hideText size="small" recordItemId={record.id_material} />
              </Space>
            )}
          />
        </Table>
      </List>
    </CanAccess>
  );
};
