"use client";

import React, { useState } from "react";
import {
  useLink,
  useRegister,
  useRouterContext,
  useRouterType,
  useTranslate,
  useActiveAuthProvider,
  RegisterPageProps,
} from "@refinedev/core";

type DivPropsType = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;
type FormPropsType = React.DetailedHTMLProps<
  React.FormHTMLAttributes<HTMLFormElement>,
  HTMLFormElement
>;

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

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    address: "",
    username: "",
    password: "",
    role: "customer",
  });

  const translate = useTranslate();
  const authProvider = useActiveAuthProvider();
  const { mutate: register, isLoading } = useRegister({
    v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const renderLink = (link: string, text?: string) => {
    return <ActiveLink to={link}>{text}</ActiveLink>;
  };

  const renderProviders = () => {
    if (providers) {
      return providers.map((provider) => (
        <div
          key={provider.name}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <button
            onClick={() =>
              register({
                ...mutationVariables,
                providerName: provider.name,
              })
            }
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            {provider?.icon}
            {provider.label ?? <label>{provider.label}</label>}
          </button>
        </div>
      ));
    }
    return null;
  };

  const content = (
    <div {...contentProps}>
      <h1 style={{ textAlign: "center" }}>
        {translate("pages.register.title", "Daftar Akun Baru")}
      </h1>

      {renderProviders()}

      {!hideForm && (
        <>
          <hr />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              register({ ...mutationVariables, ...formData });
            }}
            {...formProps}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                padding: 25,
              }}
            >
              {[
                { name: "fullname", label: "Nama Lengkap" },
                { name: "email", label: "Email" },
                { name: "phone", label: "Nomor HP" },
                { name: "address", label: "Alamat" },
                { name: "username", label: "Username" },
                { name: "password", label: "Password", type: "password" },
              ].map(({ name, label, type }) => (
                <React.Fragment key={name}>
                  <label htmlFor={`${name}-input`}>
                    {translate(`pages.register.fields.${name}`, label)}
                  </label>
                  <input
                    id={`${name}-input`}
                    name={name}
                    type={type || "text"}
                    autoCorrect="off"
                    spellCheck={false}
                    autoCapitalize="off"
                    required
                    value={(formData as any)[name]}
                    onChange={handleChange}
                  />
                </React.Fragment>
              ))}

              <input
                type="submit"
                value={translate("pages.register.buttons.submit", "Sign up")}
                disabled={isLoading}
              />

              {loginLink ?? (
                <span style={{ marginTop: "1rem" }}>
                  {translate(
                    "pages.login.buttons.haveAccount",
                    "Sudah punya akun?"
                  )}{" "}
                  {renderLink(
                    "/login",
                    translate("pages.login.signin", "Login")
                  )}
                </span>
              )}
            </div>
          </form>
        </>
      )}

      {loginLink !== false && hideForm && (
        <div style={{ textAlign: "center" }}>
          {translate("pages.login.buttons.haveAccount", "Sudah punya akun?")}{" "}
          {renderLink("/login", translate("pages.login.signin", "Login"))}
        </div>
      )}
    </div>
  );

  return (
    <div {...wrapperProps}>
      {renderContent ? renderContent(content, title) : content}
    </div>
  );
};
