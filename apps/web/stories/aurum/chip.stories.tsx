import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AurumChip } from "@/components/aurum/chip";
import { BuyInAmountPicker } from "@/components/aurum/buy-in-amount-picker";
import { AurumCanvas } from "../_decorators";

const meta = {
  title: "Aurum/Chip",
  component: AurumChip,
  parameters: { layout: "centered" },
  decorators: [(Story) => <AurumCanvas><Story /></AurumCanvas>],
} satisfies Meta<typeof AurumChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Resting: Story = { args: { children: "$100" } };
export const Selected: Story = { args: { children: "$100", selected: true } };
export const Disabled: Story = { args: { children: "$100", disabled: true } };

export const PickerLowRange: StoryObj = {
  render: () => {
    const [amount, setAmount] = useState(120);
    return (
      <div className="w-[420px]">
        <BuyInAmountPicker range={{ min: 40, max: 200 }} value={amount} onChange={setAmount} />
        <p className="mt-4 text-xs text-sapphire-300">
          Selected: <span className="text-gold-400 font-mono">${amount}</span>
        </p>
      </div>
    );
  },
};

export const PickerHighRange: StoryObj = {
  render: () => {
    const [amount, setAmount] = useState(1750);
    return (
      <div className="w-[420px]">
        <BuyInAmountPicker range={{ min: 1000, max: 2500 }} value={amount} onChange={setAmount} />
      </div>
    );
  },
};
