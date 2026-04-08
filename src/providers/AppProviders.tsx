"use client";

import { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Toaster } from "@/components/Toaster";
import { store } from "@/store";
import muiTheme from "@/theme/muiTheme";

// Bootstrap component — initialises Redux state from localStorage on mount

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline enableColorScheme />
          {children}
          <Toaster />
      </ThemeProvider>
    </Provider>
  );
}
