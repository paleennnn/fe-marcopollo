"use client";

import { useCustom, useGo, useCustomMutation, useInvalidate, useApiUrl } from "@refinedev/core";
import { Edit } from "@refinedev/antd";
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
  Skeleton,
} from "antd";
import { useNotification } from "@refinedev/core";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export const LeleEdit = () => {
  const params = useParams();
  const kolamId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const go = useGo();
  const { open } = useNotification();
  const invalidate = useInvalidate();
  const [form] = Form.useForm();
  const apiUrl = useApiUrl();

  const { data: kolamData, isLoading: isLoadingKolam } = useCustom({
    url: `${apiUrl}/leles/${kolamId}`,
    method: "get",
    config: { query: {} },
  });

  const kolam = kolamData?.data?.data;
  const { mutate: updateBudidaya, isLoading: isSubmitting } = useCustomMutation();

  // ✅ FIX: Populate form dengan benar
  useEffect(() => {
    if (isLoadingKolam) return;

    if (kolam && !kolam.budidaya) {
      open?.({
        type: "error",
        message: "Tidak Ada Budidaya",
        description: "Kolam ini belum ada budidaya yang berjalan.",
      });
      setTimeout(() => go({ to: "/leles" }), 1500);
      return;
    }

    if (kolam?.budidaya) {
      form.setFieldsValue({
        jumlah_bibit: kolam.budidaya.jumlah_bibit,
        harga_beli_total: kolam.budidaya.harga_beli_total,
        tanggal_mulai: dayjs(kolam.budidaya.tanggal_mulai),
      });
    }
  }, [kolam, isLoadingKolam, form, open, go]);

  const onFinish = (values: any) => {
    updateBudidaya(
      {
        url: `${apiUrl}/leles/${kolamId}/update-budidaya`,
        method: "put",
        values: {
          jumlah_bibit: Number(values.jumlah_bibit),
          harga_beli_total: Number(values.harga_beli_total),
          tanggal_mulai: dayjs(values.tanggal_mulai).format("YYYY-MM-DD"),
        },
      },
      {
        onSuccess: () => {
          invalidate({ resource: "leles", invalidates: ["detail", "list"] });
          open?.({
            type: "success",
            message: "Berhasil",
            description: "Budidaya berhasil diupdate",
          });
          setTimeout(() => go({ to: `/leles/show/${kolamId}` }), 1000);
        },
        onError: (error: any) => {
          open?.({
            type: "error",
            message: "Gagal",
            description: error?.response?.data?.message || "Gagal mengupdate budidaya",
          });
        },
      }
    );
  };

  if (isLoadingKolam) {
    return (
      <Edit isLoading={true}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Edit>
    );
  }

  if (!kolam) {
    return (
      <Edit isLoading={false}>
        <Alert message="Error" description="Kolam tidak ditemukan" type="error" showIcon />
      </Edit>
    );
  }

  return (
    <Edit
      title={<Title level={3}>Edit Budidaya - Kolam {kolam?.nomor_kolam}</Title>}
      saveButtonProps={{
        onClick: () => form.submit(),
        loading: isSubmitting,
      }}
    >
      <Card title="Informasi Kolam" style={{ marginBottom: 16 }} variant="outlined">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Nomor Kolam" span={1}>
            <Text strong>{kolam?.nomor_kolam}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Ukuran" span={1}>
            {kolam?.ukuran}
          </Descriptions.Item>
          <Descriptions.Item label="Kapasitas Maksimal" span={1}>
            <Text strong style={{ color: "#1890ff" }}>
              {kolam?.kapasitas_max?.toLocaleString("id-ID")} ekor
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Hari Ke-" span={1}>
            <Text strong>{kolam?.hari_ke} hari</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Alert
        message="Perhatian"
        description={`Pastikan jumlah bibit tidak melebihi kapasitas maksimal kolam (${kolam?.kapasitas_max?.toLocaleString("id-ID")} ekor)`}
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Divider />

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Jumlah Bibit Lele"
          name="jumlah_bibit"
          rules={[
            { required: true, message: "Jumlah bibit harus diisi" },
            {
              type: "number",
              max: kolam?.kapasitas_max,
              message: `Jumlah bibit tidak boleh melebihi ${kolam?.kapasitas_max?.toLocaleString("id-ID")} ekor`,
            },
          ]}
        >
          <Space.Compact style={{ width: "100%" }}>
            <Input
              type="number"
              placeholder={`Maksimal ${kolam?.kapasitas_max?.toLocaleString("id-ID")} ekor`}
              style={{ flex: 1 }}
              min={0}
            />
            <Input value="ekor" readOnly style={{ width: 60, textAlign: "center" }} />
          </Space.Compact>
        </Form.Item>

        <Form.Item
          label="Harga Beli Total"
          name="harga_beli_total"
          rules={[{ required: true, message: "Harga beli total harus diisi" }]}
          extra="Total harga pembelian bibit lele"
        >
          <Space.Compact style={{ width: "100%" }}>
            <Input value="Rp" readOnly style={{ width: 40, textAlign: "center" }} />
            <Input
              type="number"
              placeholder="Masukkan total harga beli"
              style={{ flex: 1 }}
              min={0}
            />
          </Space.Compact>
        </Form.Item>

        <Form.Item
          label="Tanggal Mulai Budidaya"
          name="tanggal_mulai"
          rules={[{ required: true, message: "Tanggal mulai harus diisi" }]}
        >
          <DatePicker style={{ width: "100%" }} format="DD MMMM YYYY" />
        </Form.Item>

        <Alert
          message="Info"
          description="Perubahan akan langsung tersimpan setelah Anda klik tombol Save"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Form>
    </Edit>
  );
};