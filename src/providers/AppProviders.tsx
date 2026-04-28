"use client";

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useServerInsertedHTML } from "next/navigation";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { Toaster } from "@/components/Toaster";
import { store } from "@/store";
import muiTheme from "@/theme/muiTheme";
import { useRef } from "react";

function MuiRegistry({ children }: { children: ReactNode }) {
  const cacheRef = useRef(
    createCache({ key: "mui", prepend: true })
  );

  // inject MUI styles ก่อน HTML อื่น ๆ เพื่อให้ SSR กับ client ตรงกัน
  useServerInsertedHTML(() => {
    const cache = cacheRef.current;
    const names = Object.keys(cache.inserted);
    if (names.length === 0) return null;

    let styles = "";
    for (const name of names) {
      if (typeof cache.inserted[name] === "string") {
        styles += cache.inserted[name];
      }
    }

    return (
      <style
        key="mui-inserted"
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <CacheProvider value={cacheRef.current}>{children}</CacheProvider>
  );
}

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <MuiRegistry>
        <ThemeProvider theme={muiTheme}>
          <CssBaseline enableColorScheme />
          {children}
          <Toaster />
        </ThemeProvider>
      </MuiRegistry>
    </Provider>
  );
}