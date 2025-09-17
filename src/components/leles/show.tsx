"use client";

import React from "react";
import { useShow, CanAccess } from "@refinedev/core";
import { Show, DateField } from "@refinedev/antd";
import { Typography, Card, Row, Col, Descriptions, Skeleton } from "antd";
import { AppstoreOutlined, CalendarOutlined } from "@ant-design/icons";
import UnauthorizedPage from "@app/unauthorized";

const { Title, Text } = Typography;

export const LeleShow = () => {
  const { query } = useShow();
  const { data, isLoading, isError } = query;
  const record = data?.data;

  if (query.error && query.error.statusCode === 403) {
    return <UnauthorizedPage />;
  }

  if (isLoading) {
    return (
      <Show title={<Text><AppstoreOutlined /> Loading...</Text>}>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </Show>
    );
  }

  if (isError) {
    return (
      <Card>
        <Title level={4} type="danger">
          Error
        </Title>
        <Text>Gagal memuat detail lele.</Text>
      </Card>
    );
  }

  return (
    <CanAccess resource="leles" action="show" fallback={<UnauthorizedPage />}>
      <Show
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AppstoreOutlined style={{ fontSize: 22, color: "#1890ff" }} />
            <Title level={4} style={{ margin: 0 }}>
              Detail Lele
            </Title>
          </span>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="Informasi Lele" bordered={false}>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Nomor Kolam">
                  {record?.nomor_kolam ?? "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Jumlah Lele">
                  {record?.jumlah_lele ?? "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Umur">
                  {record?.umur ?? "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {record?.status ?? "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Tanggal Dibuat">
                  <CalendarOutlined />{" "}
                  {record?.created_at ? (
                    <DateField value={record.created_at} format="DD MMM YYYY HH:mm" />
                  ) : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Terakhir Diperbarui">
                  <CalendarOutlined />{" "}
                  {record?.updated_at ? (
                    <DateField value={record.updated_at} format="DD MMM YYYY HH:mm" />
                  ) : "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </Show>
    </CanAccess>
  );
};
