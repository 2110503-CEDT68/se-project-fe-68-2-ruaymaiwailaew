import { createTheme } from '@mui/material/styles';

/**
 * Material UI theme — primary colour matches Tailwind's blue-600 (#2563eb)
 * Used across the entire app via ThemeProvider in App.tsx
 */
const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',   // blue-600
      light: '#3b82f6',  // blue-500
      dark: '#1d4ed8',   // blue-700
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#64748b',   // slate-500
      light: '#94a3b8',  // slate-400
      dark: '#475569',   // slate-600
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626',   // red-600
    },
    success: {
      main: '#16a34a',   // green-600
    },
    warning: {
      main: '#d97706',   // amber-600
    },
    background: {
      default: '#f8fafc', // slate-50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',   // slate-900
      secondary: '#64748b', // slate-500
    },
  },

  typography: {
    fontFamily: 'inherit',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 12,
  },

  components: {
    // ── Button ──────────────────────────────────────────────────────────────
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
          '&.MuiButton-containedPrimary': {
            background: '#2563eb',
            '&:hover': { background: '#1d4ed8' },
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },

    // ── TextField ────────────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#f8fafc',
            '& fieldset': { borderColor: '#e2e8f0' },
            '&:hover fieldset': { borderColor: '#93c5fd' },
            '&.Mui-focused fieldset': { borderColor: '#2563eb' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb' },
        },
      },
    },

    // ── OutlinedInput ────────────────────────────────────────────────────────
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#f8fafc',
        },
      },
    },

    // ── Select ───────────────────────────────────────────────────────────────
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },

    // ── Dialog ───────────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          padding: '8px',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '1.1rem',
          color: '#0f172a',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 16px 16px',
          gap: 8,
        },
      },
    },

    // ── Chip ─────────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },

    // ── Tab ──────────────────────────────────────────────────────────────────
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 44,
        },
      },
    },

    // ── Table ─────────────────────────────────────────────────────────────────
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: '0.75rem',
          color: '#64748b',
          backgroundColor: '#f8fafc',
        },
      },
    },

    // ── Paper ─────────────────────────────────────────────────────────────────
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },

    // ── Rating ────────────────────────────────────────────────────────────────
    MuiRating: {
      styleOverrides: {
        iconFilled: {
          color: '#fbbf24', // amber-400
        },
        iconEmpty: {
          color: '#e2e8f0', // slate-200
        },
      },
    },
  },
});

export default muiTheme;
