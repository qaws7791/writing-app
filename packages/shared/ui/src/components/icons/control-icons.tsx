import ArrowDownSvg from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ArrowRightSvg from "@hugeicons/core-free-icons/ArrowRight01Icon"
import ArrowUpSvg from "@hugeicons/core-free-icons/ArrowUp01Icon"
import ArrowUpDownSvg from "@hugeicons/core-free-icons/ArrowUpDownIcon"
import CancelSvg from "@hugeicons/core-free-icons/Cancel01Icon"
import GripVerticalSvg from "@hugeicons/core-free-icons/GripVerticalIcon"
import LoadingSvg from "@hugeicons/core-free-icons/Loading03Icon"
import TickSvg from "@hugeicons/core-free-icons/Tick02Icon"

import { createIcon } from "#ui/components/icons/create-icon"

export const CheckIcon = createIcon("CheckIcon", TickSvg)
export const ChevronDownIcon = createIcon("ChevronDownIcon", ArrowDownSvg)
export const ChevronRightIcon = createIcon("ChevronRightIcon", ArrowRightSvg)
export const ChevronUpIcon = createIcon("ChevronUpIcon", ArrowUpSvg)
export const ChevronsUpDownIcon = createIcon(
  "ChevronsUpDownIcon",
  ArrowUpDownSvg
)
export const GripVerticalIcon = createIcon("GripVerticalIcon", GripVerticalSvg)
export const LoadingIcon = createIcon("LoadingIcon", LoadingSvg)
export const XIcon = createIcon("XIcon", CancelSvg)
