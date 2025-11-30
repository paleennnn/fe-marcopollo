"use client";

import React, { useEffect } from "react";
import { useCustom, useGo, useCustomMutation, useInvalidate } from "@refinedev/core";
import { Create } from "@refinedev/antd";
import {
  Form,
  Input,
  DatePicker,
  Card,
  Descriptions,
  Alert,
  Typography,
  Divider,
  Space,
} from "antd";
import { useNotification } from "@refinedev/core";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { useApiUrl } from "@refinedev/core";

const { Title, Text } = Typography;

export const LeleCreate = () => {
  const params = useParams();
  const kolamId = params?.id;
  const go = useGo();
  const { open } = useNotification();
  const invalidate = useInvalidate();
  const [form] = Form.useForm();
  const apiUrl = useApiUrl();

  const { data: kolamData, isLoading: isLoadingKolam } = useCustom({
    url: `${apiUrl}/leles/${kolamId}`,
    method: "get",
  });

  const kolam = kolamData?.data?.data;

  const { mutate: startBudidaya, isLoading: isSubmitting } = useCustomMutation();

  // ✅ FIX: Tunggu hingga data ter-load baru validasi
  useEffect(() => {
    if (isLoadingKolam) {
      return; // Jangan validasi sampai loading selesai
    }

    if (kolam && kolam.status !== "kosong") {
      open?.({
        type: "error",
        message: "Kolam Tidak Kosong",
        description: "Kolam ini sudah berisi budidaya. Panen dulu sebelum memulai budidaya baru.",
      });
      go({ to: "/leles" });
    }
  }, [kolam, isLoadingKolam]); // ✅ ADD isLoadingKolam ke dependency

  const onFinish = (values: any) => {
    startBudidaya(
      {
        url: `${apiUrl}/leles/${kolamId}/start-budidaya`,
        method: "post",
        values: {
          jumlah_bibit: values.jumlah_bibit,
          harga_beli_total: values.harga_beli_total,
          tanggal_mulai: dayjs(values.tanggal_mulai).format("YYYY-MM-DD"),
        },
      },
      {
        onSuccess: () => {
          invalidate({ resource: "leles", invalidates: ["detail", "list"] });
          open?.({
            type: "success",
            message: "Berhasil",
            description: "Budidaya lele berhasil dimulai",
          });
          go({ to: `/leles/show/${kolamId}` });
        },
        onError: (error: any) => {
          open?.({
            type: "error",
            message: "Gagal",
            description: error?.response?.data?.message || "Gagal memulai budidaya",
          });
        },
      }
    );
  };

  if (isLoadingKolam) {
    return <Create isLoading={true} />;
  }

  if (!kolam) {
    return (
      <Create isLoading={false}>
        <Alert
          message="Error"
          description="Kolam tidak ditemukan"
          type="error"
          showIcon
        />
      </Create>
    );
  }

  return (
    <Create
      title={<Title level={3}>Mulai Budidaya - Kolam {kolam?.nomor_kolam}</Title>}
      saveButtonProps={{
        onClick: () => form.submit(),
        loading: isSubmitting,
      }}
    >
      {/* Info Kolam */}
      <Card
        title="Informasi Kolam"
        style={{ marginBottom: 16 }}
        variant="outlined"
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Nomor Kolam" span={1}>
            <Text strong>{kolam.nomor_kolam}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Ukuran" span={1}>
            {kolam.ukuran}
          </Descriptions.Item>
          <Descriptions.Item label="Kapasitas Maksimal" span={2}>
            <Text strong style={{ color: "#1890ff" }}>
              {kolam.kapasitas_max?.toLocaleString("id-ID")} ekor
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Alert */}
      <Alert
        message="Perhatian"
        description={`Pastikan jumlah bibit tidak melebihi kapasitas maksimal kolam (${kolam.kapasitas_max?.toLocaleString("id-ID")} ekor)`}
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Divider />

      {/* Form */}
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* Jumlah Bibit */}
        <Form.Item
          label="Jumlah Bibit Lele"
          name="jumlah_bibit"
          rules={[
            { required: true, message: "Jumlah bibit harus diisi" },
            {
              type: "number",
              max: kolam.kapasitas_max,
              message: `Jumlah bibit tidak boleh melebihi ${kolam.kapasitas_max?.toLocaleString("id-ID")} ekor`,
              transform: (value) => Number(value),
            },
          ]}
        >
          <Space.Compact style={{ width: "100%" }}>
            <Input
              type="number"
              placeholder={`Maksimal ${kolam.kapasitas_max?.toLocaleString("id-ID")} ekor`}
              style={{ flex: 1 }}
            />
            <Input value="ekor" readOnly style={{ width: 60, textAlign: "center" }} />
          </Space.Compact>
        </Form.Item>

        {/* Harga Beli Total */}
        <Form.Item
          label="Harga Beli Total"
          name="harga_beli_total"
          rules={[{ required: true, message: "Harga beli total harus diisi" }]}
          extra="Total harga pembelian bibit lele"
        >
          <Space.Compact style={{ width: "100%" }}>
            <Input
              value="Rp"
              readOnly
              style={{ width: 40, textAlign: "center" }}
            />
            <Input
              type="number"
              placeholder="Masukkan total harga beli"
              style={{ flex: 1 }}
            />
          </Space.Compact>
        </Form.Item>

        {/* Tanggal Mulai */}
        <Form.Item
          label="Tanggal Mulai Budidaya"
          name="tanggal_mulai"
          rules={[{ required: true, message: "Tanggal mulai harus diisi" }]}
          initialValue={dayjs()}
        >
          <DatePicker style={{ width: "100%" }} format="DD MMMM YYYY" />
        </Form.Item>
      </Form>
    </Create>
  );
}; 