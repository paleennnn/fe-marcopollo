"use client";

import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const KandangEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({
    resource: "kandangs",
  });

  return (
    <Edit saveButtonProps={saveButtonProps} title="Edit Kandang">
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="No Kandang"
          name="no_kandang"
          rules={[{ required: true, message: "No Kandang harus diisi" }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
};
