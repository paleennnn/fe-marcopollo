"use client";

import React, { useState } from "react";
import {
  useForgotPassword,
  useLink,
  useRouterContext,
  useRouterType,
  useTranslate,
  ForgotPasswordFormTypes,
  ForgotPasswordPageProps,
} from "@refinedev/core";
import { Card, Input, Button, Form } from "antd";
import { ArrowRightOutlined, MailOutlined } from "@ant-design/icons";
import InstallButton from "@components/installButton";

type DivPropsType = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;
type FormPropsType = React.DetailedHTMLProps<
  React.FormHTMLAttributes<HTMLFormElement>,
  HTMLFormElement
> & {
  initialValues?: Record<string, any>;
};

type ForgotPasswordProps = ForgotPasswordPageProps<
  DivPropsType,
  DivPropsType,
  FormPropsType
>;

export const ForgotPasswordPage: React.FC<ForgotPasswordProps> = ({
  loginLink,
  wrapperProps,
  contentProps,
  renderContent,
  formProps,
  title = undefined,
  mutationVariables,
}) => {
  const translate = useTranslate();
  const routerType = useRouterType();
  const Link = useLink();
  const { Link: LegacyLink } = useRouterContext();
  const ActiveLink = routerType === "legacy" ? LegacyLink : Link;

  const [form] = Form.useForm();
  const [isFormValid, setIsFormValid] = useState(false);

  const { mutate: forgotPassword, isLoading } =
    useForgotPassword<ForgotPasswordFormTypes>();

  const onFinish = (values: any) => {
    forgotPassword({ ...mutationVariables, email: values.email });
  };

  const content = (
    <div
      {...wrapperProps}
      className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <Card className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-12">
          <div>
            <h2 className="text-xl font-semibold">Marcopollo Group</h2>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-xl font-medium">Reset Password</h1>
          <p className="text-sm text-gray-600 mt-1">
            Masukkan email Anda untuk menerima tautan reset password
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="space-y-2"
          initialValues={formProps?.initialValues}
          onValuesChange={(_, allValues) => setIsFormValid(!!allValues.email)}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Masukkan email Anda!" }]}
          >
            <Input
              size="large"
              prefix={<MailOutlined />}
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            icon={<ArrowRightOutlined />}
            loading={isLoading}
            disabled={!isFormValid || isLoading}
          >
            Kirim Instruksi Reset
          </Button>
        </Form>

        <div className="text-sm text-gray-600 mt-4 text-center">
          {loginLink ?? (
            <span>
              Sudah ingat password?{" "}
              <ActiveLink to="/login" className="text-primary">
                Masuk
              </ActiveLink>
            </span>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-gray-500">
            &copy;2025 Marcopollo Group. Jika terdapat masalah silahkan hubungi{" "}
            <a href="https://wa.me/6281805793869">Admin</a>
          </p>
        </div>
      </Card>

      <InstallButton />
    </div>
  );

  return <>{renderContent ? renderContent(content, title) : content}</>;
};
