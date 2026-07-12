import * as a11yAnnotations from "@storybook/addon-a11y/preview"
import { setProjectAnnotations } from "@storybook/react-vite"
import { beforeAll } from "vitest"

import * as projectAnnotations from "#storybook-config/preview"

const project = setProjectAnnotations([a11yAnnotations, projectAnnotations])

beforeAll(project.beforeAll)
