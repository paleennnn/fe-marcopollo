"use client";

import React, { useEffect } from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, DatePicker } from "antd";
import { CanAccess } from "@refinedev/core";
import UnauthorizedPage from "@app/unauthorized";
import dayjs from "dayjs";

export const LeleEdit = () => {
  const { formProps, saveButtonProps, query } = useForm({
    action: "edit",
    resource: "leles",
    meta: {
      fields: ["id_lele", "nomor_kolam", "jumlah_lele", "tanggal_mulai"],
    },
  });

  const data = query?.data?.data;

  useEffect(() => {
    if (data && formProps.form) {
      formProps.form.setFieldsValue({
        nomor_kolam: data.nomor_kolam,
        jumlah_lele: data.jumlah_lele,
        tanggal_mulai: data.tanggal_mulai ? dayjs(data.tanggal_mulai) : null,
      });
    }
  }, [data, formProps.form]);

  const onFinish = async (values: any) => {
    return formProps.onFinish?.({
      ...values,
      tanggal_mulai: dayjs(values.tanggal_mulai).format("YYYY-MM-DD"),
    });
  };

  return (
    <CanAccess resource="leles" action="edit" fallback={<UnauthorizedPage />}>
      <Edit saveButtonProps={saveButtonProps}>
        <Form {...formProps} onFinish={onFinish} layout="vertical">
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
            label="Tanggal Mulai"
            name="tanggal_mulai"
            rules={[{ required: true, message: "Tanggal mulai wajib diisi" }]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>
        </Form>
      </Edit>
    </CanAccess>
  );
};
