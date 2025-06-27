/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  app: {
    primary: '#00529B',
    secondary: '#003B5C',
    accent: '#00B2A9',
    danger: '#d9534f',
    warning: '#f0ad4e',
    info: '#5bc0de',
    success: '#004d00',
    lightBackground: '#f4f9f9',
    lightGray: '#ECE5DD',
    white: '#fff',
    black: '#000',
    gray1: '#ccc',
    gray2: '#ddd',
    gray3: '#fafafa',
    darkText: '#303030',
    mediumText: '#666',
    lightText: '#888',
    headerGradientStart: '#003B5C',
    headerGradientEnd: '#007e99',
    reportCardBackground: '#e3f2fd',
  },
};
