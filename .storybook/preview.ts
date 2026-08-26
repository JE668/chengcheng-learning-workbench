import type { Preview } from '@storybook/react';
import React from 'react';
import '../src/app/globals.css';
import { ThemeProvider } from './ThemeProvider';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a2e' },
        { name: 'moko', value: '#fff0f5' },
      ],
    },
    layout: 'centered',
    actions: { argTypesRegex: '^on[A-Z].*' },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div className="p-4 min-w-[320px]">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark', 'moko'],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;