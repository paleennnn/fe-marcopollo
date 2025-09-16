"use client";

import React from "react";
import { useShow, CanAccess } from "@refinedev/core";
import { Show, TextField, DateField } from "@refinedev/antd";
import { Descriptions, Card } from "antd";
import UnauthorizedPage from "@app/unauthorized";

export const UserShow = () => {
  const { query } = useShow();
  const { data, isLoading } = query;

  const record = data?.data;

  return (
    <CanAccess resource="users" action="show" fallback={<UnauthorizedPage />}>
      <Show isLoading={isLoading}>
        <Card bordered>
          <Descriptions bordered column={1} title="Detail User">
            <Descriptions.Item label="Fullname">
              <TextField value={record?.fullname} />
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              <TextField value={record?.email} />
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              <TextField value={record?.phone} />
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              <TextField value={record?.address} />
            </Descriptions.Item>
            <Descriptions.Item label="Username">
              <TextField value={record?.username} />
            </Descriptions.Item>
            <Descriptions.Item label="Role">
              <TextField value={record?.role} />
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              <DateField value={record?.created_at} format="DD MMM YYYY HH:mm" />
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              <DateField value={record?.updated_at} format="DD MMM YYYY HH:mm" />
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Show>
    </CanAccess>
  );
};
