"use client";

import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, DatePicker, Upload } from "antd";

export const KambingEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({
    resource: "kambings",
    redirect: "show",
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Foto" name="image">
          <Upload
            beforeUpload={() => false}
            listType="picture-card"
            maxCount={1}
          >
            <div>Upload</div>
          </Upload>
        </Form.Item>
        <Form.Item label="Tanggal Ditambahkan" name="tanggal_ditambahkan" rules={[{ required: true }]}>
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Umur (bulan)" name="umur" rules={[{ required: true }]}>
          <Input type="number" />
        </Form.Item>
        <Form.Item label="Keterangan" name="keterangan" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Catatan" name="catatan">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
