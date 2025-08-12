"use client";

import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  UpdatePasswordPage,
} from "@components/pages/auth/components";
import type { AuthPageProps } from "@refinedev/core";

export const AuthPage = (props: AuthPageProps) => {
  const { type } = props;

  switch (type) {
    case "register":
      return <RegisterPage {...props} />;
    case "forgotPassword":
      return <ForgotPasswordPage {...props} />;
    case "updatePassword":
      return <UpdatePasswordPage {...props} />;
    default:
      return <LoginPage {...props} />;
  }
};
