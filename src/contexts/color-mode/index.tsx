"use client";

import { App as AntdApp, ConfigProvider, theme } from "antd";
import Cookies from "js-cookie";
import React, {
  type PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from "react";

type ColorModeContextType = {
  mode: string;
  setMode: (checked: boolean) => void;
};

export const ColorModeContext = createContext<ColorModeContextType>(
  {} as ColorModeContextType
);

type ColorModeContextProviderProps = {
  defaultMode?: string;
};

export const ColorModeContextProvider: React.FC<
  PropsWithChildren<ColorModeContextProviderProps>
> = ({ children, defaultMode }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setModeState] = useState(defaultMode || "light");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(mode);
  }, [mode, isMounted]);

  const setColorMode = (checked: boolean) => {
    const newMode = checked ? "dark" : "light";
    setModeState(newMode);
    Cookies.set("theme", newMode);
    document.documentElement.classList.add("theme-fade");
    setTimeout(() => {
      document.documentElement.classList.remove("theme-fade");
    }, 300);

    // Tambah kelas animasi fade
    document.body.classList.add("theme-fade");
    setTimeout(() => {
      document.body.classList.remove("theme-fade");
    }, 300);
  };

  const { darkAlgorithm, defaultAlgorithm } = theme;

  return (
    <ColorModeContext.Provider value={{ mode, setMode: setColorMode }}>
      <ConfigProvider
        theme={{
          algorithm: mode === "light" ? defaultAlgorithm : darkAlgorithm,
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </ColorModeContext.Provider>
  );
};
