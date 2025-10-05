"use client";

import React from "react";
import { BaseRecord, CanAccess } from "@refinedev/core";
import { useTable, List, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import UnauthorizedPage from "@app/unauthorized";

const { Text } = Typography;

interface User {
  id: number;
  fullname: string;
  email: string;
  phone: string;
  address: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const UserList = () => {
  const { tableProps } = useTable<User>({
    syncWithLocation: true,
    resource: "users",
  });

  return (
    <CanAccess resource="users" action="list" fallback={<UnauthorizedPage />}>
      <List
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <UserOutlined style={{ fontSize: 24, marginRight: 12 }} />
            <Text strong style={{ fontSize: 20 }}>
              Manajemen Pengguna
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

          {/* Nama Lengkap */}
          <Table.Column
            dataIndex="fullname"
            title="Nama Lengkap"
            sorter
            render={(value: string) => <Text strong>{value}</Text>}
          />

          {/* Email */}
          <Table.Column
            dataIndex="email"
            title="Email"
            sorter
            render={(value: string) => <Text>{value}</Text>}
          />

          {/* Telepon */}
          <Table.Column
            dataIndex="phone"
            title="Telepon"
            sorter
            render={(value: string) => <Text>{value}</Text>}
          />

          {/* Username */}
          <Table.Column
            dataIndex="username"
            title="Username"
            sorter
            render={(value: string) => <Text>{value}</Text>}
          />

          {/* Role */}
          <Table.Column
            dataIndex="role"
            title="Role"
            sorter
            render={(value: string) => <Text>{value}</Text>}
          />

          {/* Tanggal Dibuat 
          <Table.Column
            dataIndex="createdAt"
            title="Tanggal Dibuat"
            sorter
            render={(value: string) => <Text>{new Date(value).toLocaleString()}</Text>}
          /> */}

          {/* Aksi */}
          <Table.Column
            title="Aksi"
            width={180}
            fixed="right"
            render={(_, record: BaseRecord) => (
              <Space>
                <ShowButton hideText size="small" recordItemId={record.id} />
                <EditButton hideText size="small" recordItemId={record.id} title="Edit pengguna" />
                <DeleteButton hideText size="small" recordItemId={record.id} title="Hapus pengguna" />
              </Space>
            )}
          />
        </Table>
      </List>
    </CanAccess>
  );
};