"use client";

import React from "react";
import { useShow } from "@refinedev/core";
import { Show, DateField } from "@refinedev/antd";
import { Typography, Card, Descriptions } from "antd";
import { AppstoreOutlined, CalendarOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export const KandangShow: React.FC = () => {
  const { query } = useShow();
  const { data, isLoading, isError } = query;
  const record = data?.data;

  if (isError) {
    return (
      <Card>
        <Title level={4} type="danger">
          Error
        </Title>
        <Text>Gagal memuat detail kandang.</Text>
      </Card>
    );
  }

  return (
    <Show
      isLoading={isLoading}
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AppstoreOutlined style={{ fontSize: 22, color: "#1890ff" }} />
          <Title level={4} style={{ margin: 0 }}>
            Detail Kandang
          </Title>
        </span>
      }
    >
      <Card bordered={false}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="No Kandang">
            {record?.no_kandang}
          </Descriptions.Item>
          <Descriptions.Item label="Jumlah Kambing">
            {record?.jumlah_kambing}
          </Descriptions.Item>
          <Descriptions.Item label="Tanggal Dibuat">
            <CalendarOutlined />{" "}
            <DateField value={record?.created_at} format="DD MMM YYYY HH:mm" />
          </Descriptions.Item>
          <Descriptions.Item label="Terakhir Diperbarui">
            <CalendarOutlined />{" "}
            <DateField value={record?.updated_at} format="DD MMM YYYY HH:mm" />
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Show>
  );
};
