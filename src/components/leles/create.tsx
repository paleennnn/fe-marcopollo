"use client";

import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, DatePicker, Divider, Alert } from "antd";
import { CanAccess } from "@refinedev/core";
import UnauthorizedPage from "@app/unauthorized";
import dayjs from "dayjs";

export const LeleCreate = () => {
  const { formProps, saveButtonProps } = useForm({
    action: "create",
    resource: "leles",
  });

  const onFinish = async (values: any) => {
    return formProps.onFinish?.({
      ...values,
      tanggal_mulai: dayjs(values.tanggal_mulai).format("YYYY-MM-DD"),
    });
  };

  return (
    <CanAccess resource="leles" action="create" fallback={<UnauthorizedPage />}>
      <Create saveButtonProps={saveButtonProps}>
        <Alert
          message={<strong>Perhatian</strong>}
          description="Pastikan data lele yang Anda input sudah benar."
          type="warning"
          showIcon
        />
        <Divider />

        <Form {...formProps} onFinish={onFinish} layout="vertical">
          <Form.Item
            label="Nomor Kolam"
            name="nomor_kolam"
            rules={[{ required: true, message: "Nomor kolam wajib diisi" }]}
          >
            <Input placeholder="Masukkan nomor kolam (unik)" />
          </Form.Item>

          <Form.Item
            label="Jumlah Lele"
            name="jumlah_lele"
            rules={[{ required: true, message: "Jumlah lele wajib diisi" }]}
          >
            <Input type="number" placeholder="Masukkan jumlah lele" />
          </Form.Item>

          <Form.Item
            label="Tanggal Mulai"
            name="tanggal_mulai"
            rules={[{ required: true, message: "Tanggal mulai wajib diisi" }]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>
        </Form>
      </Create>
    </CanAccess>
  );
};
