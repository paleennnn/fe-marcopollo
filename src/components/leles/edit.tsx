"use client";

import React, { useEffect } from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { CanAccess } from "@refinedev/core";
import UnauthorizedPage from "@app/unauthorized";

export const LeleEdit = () => {
  const { formProps, saveButtonProps, query } = useForm({
    action: "edit",
    resource: "leles",
    meta: {
      fields: ["id_lele", "nomor_kolam", "jumlah_lele", "umur", "status"],
    },
  });

  const data = query?.data?.data;

  useEffect(() => {
    if (data && formProps.form) {
      formProps.form.setFieldsValue({
        nomor_kolam: data.nomor_kolam,
        jumlah_lele: data.jumlah_lele,
        umur: data.umur,
        status: data.status,
      });
    }
  }, [data, formProps.form]);

  return (
    <CanAccess resource="leles" action="edit" fallback={<UnauthorizedPage />}>
      <Edit saveButtonProps={saveButtonProps}>
        <Form {...formProps} layout="vertical">
          <Form.Item
            label="Nomor Kolam"
            name="nomor_kolam"
            rules={[{ required: true, message: "Nomor kolam wajib diisi" }]}
          >
            <Input placeholder="Masukkan nomor kolam" />
          </Form.Item>

          <Form.Item
            label="Jumlah Lele"
            name="jumlah_lele"
            rules={[{ required: true, message: "Jumlah lele wajib diisi" }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            label="Umur"
            name="umur"
            rules={[{ required: true, message: "Umur wajib diisi" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Status wajib dipilih" }]}
          >
            <Select
              options={[
                { label: "Siap Panen", value: "Siap Panen" },
                { label: "Belum Siap Panen", value: "Belum Siap Panen" },
              ]}
            />
          </Form.Item>
        </Form>
      </Edit>
    </CanAccess>
  );
};
