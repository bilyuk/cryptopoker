import type { Preview } from "@storybook/nextjs-vite";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "aurum",
      values: [
        { name: "aurum", value: "#070a16" },
        { name: "panel", value: "#0b1024" },
      ],
    },
    a11y: {
      test: "todo",
    },
  },
};

export default preview;
