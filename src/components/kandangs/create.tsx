"use client";

import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const KandangCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({
    resource: "kandangs",
  });

  return (
    <Create saveButtonProps={saveButtonProps} title="Tambah Kandang">
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="No Kandang"
          name="no_kandang"
          rules={[{ required: true, message: "No Kandang harus diisi" }]}
        >
          <Input placeholder="Contoh: 01" />
        </Form.Item>
      </Form>
    </Create>
  );
};
