"use client";

import React, { useState } from "react";
import {
  useActiveAuthProvider,
  useLink,
  useRegister,
  useRouterContext,
  useRouterType,
  useTranslate,
  RegisterPageProps,
} from "@refinedev/core";
import { Card, Input, Button, Form } from "antd";
import {
  ArrowRightOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";

type DivPropsType = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;
import type { FormProps } from "antd";

type FormPropsType = FormProps;

type RegisterProps = RegisterPageProps<
  DivPropsType,
  DivPropsType,
  FormPropsType
>;

export const RegisterPage: React.FC<RegisterProps> = ({
  providers,
  loginLink,
  wrapperProps,
  contentProps,
  renderContent,
  formProps,
  title = undefined,
  hideForm,
  mutationVariables,
}) => {
  const routerType = useRouterType();
  const Link = useLink();
  const { Link: LegacyLink } = useRouterContext();
  const ActiveLink = routerType === "legacy" ? LegacyLink : Link;

  const [form] = Form.useForm();
  const [isFormValid, setIsFormValid] = useState(false);

  const translate = useTranslate();
  const authProvider = useActiveAuthProvider();
  const { mutate: register, isLoading } = useRegister({
    v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
  });

  const handleFormChange = (_: any, allValues: any) => {
    // cek semua field terisi
    setIsFormValid(
      !!allValues.fullname &&
        !!allValues.email &&
        !!allValues.phone &&
        !!allValues.address &&
        !!allValues.username &&
        !!allValues.password
    );
  };

  const onFinish = (values: any) => {
    register({
      ...mutationVariables,
      ...values,
      role: "customer",
    });
  };

  const content = (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-8">
          <h1 className="text-xl font-medium">
            {translate("pages.register.title", "Daftar Akun Baru")}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Lengkapi data anda untuk membuat akun
          </p>
        </div>

        {!hideForm && (
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onValuesChange={handleFormChange}
            className="space-y-2"
            {...formProps}
          >
            <Form.Item
              name="fullname"
              label="Nama Lengkap"
              rules={[{ required: true, message: "Masukkan nama lengkap!" }]}
            >
              <Input
                size="large"
                placeholder="Masukkan nama lengkap"
                disabled={isLoading}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Masukkan email!" },
                { type: "email", message: "Email tidak valid!" },
              ]}
            >
              <Input
                size="large"
                placeholder="Masukkan email"
                disabled={isLoading}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Nomor HP"
              rules={[{ required: true, message: "Masukkan nomor HP!" }]}
            >
              <Input
                size="large"
                placeholder="Masukkan nomor HP"
                disabled={isLoading}
              />
            </Form.Item>

            <Form.Item
              name="address"
              label="Alamat"
              rules={[{ required: true, message: "Masukkan alamat!" }]}
            >
              <Input
                size="large"
                placeholder="Masukkan alamat"
                disabled={isLoading}
              />
            </Form.Item>

            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Masukkan username!" }]}
            >
              <Input
                size="large"
                placeholder="Masukkan username"
                disabled={isLoading}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Masukkan password!" }]}
            >
              <div className="flex space-x-3">
                <Input.Password
                  size="large"
                  placeholder="Masukkan password"
                  className="rounded-md"
                  iconRender={(visible) =>
                    visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                  }
                  disabled={isLoading}
                />
                <Button
                  className={`${isFormValid ? "bg-primary" : "bg-gray-300"}`}
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<ArrowRightOutlined />}
                  loading={isLoading}
                  disabled={!isFormValid || isLoading}
                />
              </div>
            </Form.Item>
          </Form>
        )}

        <div className="text-sm text-gray-600 mt-1">
          {loginLink ?? (
            <span>
              {translate(
                "pages.login.buttons.haveAccount",
                "Sudah punya akun?"
              )}{" "}
              <ActiveLink to="/login">
                {translate("pages.login.signin", "Login")}
              </ActiveLink>
            </span>
          )}
        </div>
      </Card>
    </div>
  );

  return (
    <div {...wrapperProps}>
      {renderContent ? renderContent(content, title) : content}
    </div>
  );
};
