import { createTheme, Paper, Card, Button, Modal } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'gold',
  primaryShade: 5,
  colors: {
    darkGray: [
      '#f8f9fa', '#f1f3f5', '#e9ecef', '#dee2e6', '#ced4da', 
      '#adb5bd', '#868e96', '#495057', '#343a40', '#181a1b'
    ],
    gold: [
      '#fffceb', '#fdf3c6', '#fce89e', '#fbdd73', '#fad143',
      '#f9c91d', '#e5b613', '#c29707', '#9b7600', '#765800'
    ],
    brown: [
      '#f4ece4', '#e6d4c6', '#d8bba6', '#c9a287', '#bb8b6a',
      '#a2704f', '#7d563d', '#593d2c', '#36241b', '#160c07'
    ],
    deepRed: [
      '#fbeae9', '#f2cccb', '#e8abad', '#de8a8e', '#d5686f',
      '#bc4e55', '#923c42', '#692a2f', '#3f181b', '#170607'
    ],
    forestGreen: [
      '#eef7ef', '#d5eadd', '#b8ddc8', '#98cfb1', '#7dc29d',
      '#5eaa82', '#478464', '#325d46', '#1d3829', '#08140c'
    ]
  },
  fontFamily: "'Inter', sans-serif",
  headings: {
    fontFamily: "'Cinzel', 'Playfair Display', serif",
    fontWeight: '700',
  },
  components: {
    Paper: Paper.extend({
      defaultProps: {
        radius: 'lg',
        shadow: 'xl'
      },
      styles: {
        root: {
          backgroundColor: 'rgba(30,33,36,0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-subtle)',
        }
      }
    }),
    Card: Card.extend({
      defaultProps: {
        radius: 'lg',
        shadow: 'xl',
        padding: 'xl'
      },
      styles: {
        root: {
          backgroundColor: 'rgba(33,37,41,0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.06)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }
      }
    }),
    Button: Button.extend({
      defaultProps: {
        radius: 'md',
        fw: 600,
      },
      styles: {
        root: {
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          transition: 'transform 0.1s ease, filter 0.2s',
        }
      }
    }),
    Modal: Modal.extend({
      defaultProps: {
        centered: true,
        radius: 'xl',
      },
      styles: {
        content: {
          backgroundColor: '#1a1c1d',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.7)'
        },
        header: {
          backgroundColor: 'transparent',
        }
      }
    })
  }
});
