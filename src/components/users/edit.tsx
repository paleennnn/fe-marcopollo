"use client";

import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { CanAccess } from "@refinedev/core";
import UnauthorizedPage from "@app/unauthorized";

export const UserEdit = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <CanAccess resource="users" action="edit" fallback={<UnauthorizedPage />}>
      <Edit saveButtonProps={saveButtonProps}>
        <Form {...formProps} layout="vertical">
          <Form.Item
            label="Fullname"
            name="fullname"
            rules={[{ required: true, message: "Fullname wajib diisi" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email wajib diisi" },
              { type: "email", message: "Format email tidak valid" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input />
          </Form.Item>

          <Form.Item label="Address" name="address">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Username wajib diisi" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            help="Kosongkan jika tidak ingin mengubah password"
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: "Role wajib dipilih" }]}
          >
            <Select>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="customer">Customer</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Edit>
    </CanAccess>
  );
};
