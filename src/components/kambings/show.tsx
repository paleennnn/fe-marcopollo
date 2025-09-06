"use client";

import React from "react";
import { useShow } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import { Typography, Card, Image } from "antd";
import { useApiUrl } from "@refinedev/core";

const { Title, Text } = Typography;

export const KambingShow: React.FC = () => {
  const { query } = useShow();
  const record = query?.data?.data;
  const apiUrl = useApiUrl();

  return (
    <Show title={<Title level={4}>Detail Kambing</Title>}>
      <Card>
        <p>
          <Text strong>Foto:</Text>
        </p>
        {record?.image && (
          <Image src={`${apiUrl}/${record.image}`} width={200} />
        )}
        <p>
          <Text strong>Tanggal Ditambahkan:</Text> {record?.tanggal_ditambahkan}
        </p>
        <p>
          <Text strong>Umur:</Text> {record?.umur} bulan
        </p>
        <p>
          <Text strong>Keterangan:</Text> {record?.keterangan}
        </p>
        <p>
          <Text strong>Catatan:</Text> {record?.catatan}
        </p>
      </Card>
    </Show>
  );
};
