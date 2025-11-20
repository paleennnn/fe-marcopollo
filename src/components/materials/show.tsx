"use client";

import React from "react";
import { useShow, useApiUrl, CanAccess } from "@refinedev/core";
import { Show, DateField } from "@refinedev/antd";
import {
  Typography,
  Card,
  Row,
  Col,
  Descriptions,
  Image,
  Skeleton,
  Tag,
} from "antd";
import { AppstoreOutlined, CalendarOutlined } from "@ant-design/icons";
import UnauthorizedPage from "@app/unauthorized";

const { Title, Text } = Typography;

export const MaterialShow = () => {
  const { query } = useShow();
  const { data, isLoading, isError } = query;
  const record = data?.data;

  const apiUrl = useApiUrl();

  const renderImage = () => {
    if (!record?.image) {
      return <Text type="secondary">Tidak ada gambar</Text>;
    }

    const imageUrl =
      apiUrl.endsWith("/") && record.image.startsWith("/")
        ? `${apiUrl}${record.image.substring(1)}`
        : !apiUrl.endsWith("/") && !record.image.startsWith("/")
        ? `${apiUrl}/${record.image}`
        : `${apiUrl}${record.image}`;

    return (
      <Image
        src={imageUrl}
        alt={record.nama_material}
        style={{ maxWidth: "100%", borderRadius: "8px" }}
      />
    );
  };

  // Hitung margin keuntungan
  const calculateMargin = () => {
    if (!record?.harga_beli || !record?.harga_satuan) return 0;
    const profit = record.harga_satuan - record.harga_beli;
    const margin = (profit / record.harga_beli) * 100;
    return margin.toFixed(2);
  };

  if (query.error && query.error.statusCode === 403) {
    return <UnauthorizedPage />;
  }

  if (isLoading) {
    return (
      <Show
        title={
          <Text>
            <AppstoreOutlined /> Loading...
          </Text>
        }
      >
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
        <Text>Gagal memuat detail material.</Text>
      </Card>
    );
  }

  return (
    <CanAccess
      resource="materials"
      action="show"
      fallback={<UnauthorizedPage />}
    >
      <Show
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AppstoreOutlined style={{ fontSize: 22, color: "#1890ff" }} />
            <Title level={4} style={{ margin: 0 }}>
              Detail Material
            </Title>
          </span>
        }
      >
        <Row gutter={[16, 16]}>
          {/* Informasi Material */}
          <Col xs={24} lg={16}>
            <Card title="Informasi Material" bordered={false}>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Nama Material">
                  {record?.nama_material ?? "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Harga Beli">
                  <Text strong style={{ color: "#f5222d" }}>
                    Rp {record?.harga_beli?.toLocaleString("id-ID") ?? "-"}
                  </Text>
                </Descriptions.Item>

                <Descriptions.Item label="Harga Jual/Satuan">
                  <Text strong style={{ color: "#52c41a" }}>
                    Rp {record?.harga_satuan?.toLocaleString("id-ID") ?? "-"}
                  </Text>
                </Descriptions.Item>

                <Descriptions.Item label="Margin Keuntungan">
                  {record?.harga_beli && record?.harga_satuan ? (
                    <>
                      <Tag color="blue">{calculateMargin()}%</Tag>
                      <Text style={{ marginLeft: 8 }}>
                        (Rp{" "}
                        {(
                          record.hargaSatuan - record.hargaBeli
                        ).toLocaleString("id-ID")})
                      </Text>
                    </>
                  ) : (
                    "-"
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="Tanggal Dibuat">
                  <CalendarOutlined />{" "}
                  {record?.created_at ? (
                    <DateField
                      value={record.created_at}
                      format="DD MMM YYYY HH:mm"
                    />
                  ) : (
                    "-"
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="Terakhir Diperbarui">
                  <CalendarOutlined />{" "}
                  {record?.updated_at ? (
                    <DateField
                      value={record.updated_at}
                      format="DD MMM YYYY HH:mm"
                    />
                  ) : (
                    "-"
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Gambar */}
          <Col xs={24} lg={8}>
            <Card title="Gambar Material" bordered={false}>
              {renderImage()}
            </Card>
          </Col>
        </Row>
      </Show>
    </CanAccess>
  );
};
