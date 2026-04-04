import { createTheme, Paper, Card } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'gold',
  colors: {
    darkGray: [
      '#f8f9fa', '#f1f3f5', '#e9ecef', '#dee2e6', '#ced4da', 
      '#adb5bd', '#868e96', '#495057', '#343a40', '#181a1b'
    ],
    gold: [
      '#fcf6d6', '#faeda5', '#f6e076', '#f2d347', '#eec91e',
      '#d6b216', '#a78a0d', '#766106', '#483902', '#1b1200'
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
        radius: 'md',
        shadow: 'sm'
      }
    }),
    Card: Card.extend({
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
        padding: 'lg'
      }
    })
  }
});
