"use client";

import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Divider, Alert } from "antd";
import { CanAccess } from "@refinedev/core";
import UnauthorizedPage from "@app/unauthorized";

export const LeleCreate = () => {
  const { formProps, saveButtonProps } = useForm({
    action: "create",
    resource: "leles",
  });

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

        <Form {...formProps} layout="vertical">
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
            label="Umur (bulan)"
            name="umur"
            rules={[{ required: true, message: "Umur wajib diisi" }]}
          >
            <Input placeholder="Masukkan umur lele (contoh: 3 bulan)" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Status wajib dipilih" }]}
          >
            <Select
              placeholder="Pilih status"
              options={[
                { label: "Siap Panen", value: "Siap Panen" },
                { label: "Belum Siap Panen", value: "Belum Siap Panen" },
              ]}
            />
          </Form.Item>
        </Form>
      </Create>
    </CanAccess>
  );
};
