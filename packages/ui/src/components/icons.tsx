import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

export const CloseIcon = (props: IconProps) => (
  <svg
    aria-hidden="true"
    aria-label="Close icon"
    fill="none"
    height={16}
    role="presentation"
    viewBox="0 0 16 16"
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M3.47 3.47a.75.75 0 0 1 1.06 0L8 6.94l3.47-3.47a.75.75 0 1 1 1.06 1.06L9.06 8l3.47 3.47a.75.75 0 1 1-1.06 1.06L8 9.06l-3.47 3.47a.75.75 0 0 1-1.06-1.06L6.94 8 3.47 4.53a.75.75 0 0 1 0-1.06Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)

export const ExternalLinkIcon = ({
  height = 9,
  width = 9,
  ...props
}: IconProps) => (
  <svg
    aria-hidden="true"
    aria-label="External link icon"
    fill="none"
    height={height}
    role="presentation"
    viewBox="0 0 7 7"
    width={width}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1.20592 6.84333L0.379822 6.01723L4.52594 1.8672H1.37819L1.38601 0.731812H6.48742V5.83714H5.34421L5.35203 2.6933L1.20592 6.84333Z"
      fill="currentColor"
    />
  </svg>
)

export type { IconProps }
