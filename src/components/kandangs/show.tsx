"use client";

import React from "react";
import { useShow, useOne, useApiUrl } from "@refinedev/core";
import { Show, List, useTable, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Typography, Space, Image, Button, Card } from "antd";
import { AppstoreOutlined, PlusOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export const KandangShow: React.FC = () => {
  const { query } = useShow();
  const record = query?.data?.data;
  const apiUrl = useApiUrl();

  // ambil daftar kambing dari resource nested
  const { tableProps } = useTable({
    resource: `kandangs/${record?.id}/kambings`,
    syncWithLocation: false,
  });

  return (
    <Show
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AppstoreOutlined style={{ fontSize: 22, color: "#1890ff" }} />
          <Title level={4} style={{ margin: 0 }}>
            Detail Kandang
          </Title>
        </span>
      }
    >
      <Card bordered style={{ marginBottom: 24 }}>
        <p>
          <Text strong>No Kandang:</Text> {record?.no_kandang}
        </p>
        <p>
          <Text strong>Jumlah Kambing:</Text> {record?.jumlah_kambing}
        </p>
        <p>
          <Text strong>Tanggal Dibuat:</Text> {record?.created_at}
        </p>
        <p>
          <Text strong>Terakhir Diperbarui:</Text> {record?.updated_at}
        </p>
      </Card>

      <List
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Title level={5} style={{ margin: 0 }}>
              Daftar Kambing
            </Title>
            <Button type="primary" icon={<PlusOutlined />} href={`/kambings/create?kandangId=${record?.id}`}>
              Tambah Kambing
            </Button>
          </div>
        }
      >
        <Table {...tableProps} rowKey="id" bordered>
          <Table.Column align="center" title="No." render={(_, __, index) => index + 1} />
          <Table.Column
            align="center"
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
          <Table.Column align="center" dataIndex="tanggalDitambahkan" title="Tanggal Ditambahkan" />
          <Table.Column align="center" dataIndex="umur" title="Umur (bulan)" />
          <Table.Column align="center" dataIndex="keterangan" title="Keterangan" />
          <Table.Column align="center" dataIndex="catatan" title="Catatan" />

          <Table.Column
            align="center"
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
    </Show>
  );
};
