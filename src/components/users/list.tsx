"use client";

import React from "react";
import { useTable, List, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Space } from "antd";
import { CanAccess } from "@refinedev/core";
import UnauthorizedPage from "@app/unauthorized";

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
  });

  return (
    <CanAccess resource="users" action="list" fallback={<UnauthorizedPage />}>
      <List>
        <Table {...tableProps} rowKey="id">
          <Table.Column dataIndex="fullname" title="Fullname" />
          <Table.Column dataIndex="email" title="Email" />
          <Table.Column dataIndex="phone" title="Phone" />
          <Table.Column dataIndex="username" title="Username" />
          <Table.Column dataIndex="role" title="Role" />
          <Table.Column
            dataIndex="createdAt"
            title="Created At"
            render={(value) => new Date(value).toLocaleString()}
          />
          <Table.Column
            title="Actions"
            render={(_, record: User) => (
              <Space>
                <EditButton hideText size="small" recordItemId={record.id} />
                <ShowButton hideText size="small" recordItemId={record.id} />
                <DeleteButton hideText size="small" recordItemId={record.id} />
              </Space>
            )}
          />
        </Table>
      </List>
    </CanAccess>
  );
};
