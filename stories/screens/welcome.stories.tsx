import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WelcomeScreen } from "@/components/aurum/screens/welcome-screen";
import { AurumCanvas } from "../_decorators";

const meta = {
  title: "Screens/Welcome",
  component: WelcomeScreen,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <AurumCanvas padded={false}>
        <Story />
      </AurumCanvas>
    ),
  ],
} satisfies Meta<typeof WelcomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onEnter: () => undefined,
  },
};
