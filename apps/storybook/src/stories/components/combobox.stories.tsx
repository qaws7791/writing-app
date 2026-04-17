import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
} from "@/components/ui/combobox"

const frameworks = [
  { value: "next.js", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt.js", label: "Nuxt.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
]

const meta: Meta = {
  title: "Components/Combobox",
  parameters: { layout: "centered" },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <Combobox>
      <ComboboxInput
        placeholder="Search framework..."
        className="w-[250px]"
        showClear
      />
      <ComboboxContent>
        {frameworks.map((framework) => (
          <ComboboxItem key={framework.value} value={framework.value}>
            {framework.label}
          </ComboboxItem>
        ))}
      </ComboboxContent>
    </Combobox>
  ),
}

export const WithGroups: Story = {
  render: () => (
    <Combobox>
      <ComboboxInput
        placeholder="Search framework..."
        className="w-[250px]"
        showClear
      />
      <ComboboxContent>
        <ComboboxGroup>
          <ComboboxLabel>JavaScript</ComboboxLabel>
          <ComboboxItem value="next.js">Next.js</ComboboxItem>
          <ComboboxItem value="remix">Remix</ComboboxItem>
          <ComboboxItem value="astro">Astro</ComboboxItem>
        </ComboboxGroup>
        <ComboboxGroup>
          <ComboboxLabel>Other</ComboboxLabel>
          <ComboboxItem value="sveltekit">SvelteKit</ComboboxItem>
          <ComboboxItem value="nuxt.js">Nuxt.js</ComboboxItem>
        </ComboboxGroup>
      </ComboboxContent>
    </Combobox>
  ),
}
