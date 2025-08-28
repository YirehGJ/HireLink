import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11.5 13.5C12.8807 13.5 14 12.3807 14 11C14 9.61929 12.8807 8.5 11.5 8.5C10.1193 8.5 9 9.61929 9 11C9 12.3807 10.1193 13.5 11.5 13.5Z"
        className="text-primary"
        fill="currentColor"
      />
      <path
        d="M20.5 13.5C21.8807 13.5 23 12.3807 23 11C23 9.61929 21.8807 8.5 20.5 8.5C19.1193 8.5 18 9.61929 18 11C18 12.3807 19.1193 13.5 20.5 13.5Z"
        className="text-primary"
        fill="currentColor"
      />
      <path
        d="M8 24V18.5C8 17.5717 8.36875 16.6815 9.02513 16.0251C9.6815 15.3687 10.5717 15 11.5 15C12.4283 15 13.3185 15.3687 13.9749 16.0251C14.6313 16.6815 15 17.5717 15 18.5V24H8Z"
        className="text-primary/70"
        fill="currentColor"
      />
      <path
        d="M17 24V18.5C17 17.5717 17.3687 16.6815 18.0251 16.0251C18.6815 15.3687 19.5717 15 20.5 15C21.4283 15 22.3185 15.3687 22.9749 16.0251C23.6313 16.6815 24 17.5717 24 18.5V24H17Z"
        className="text-primary/70"
        fill="currentColor"
      />
      <rect
        x="3"
        y="3"
        width="26"
        height="26"
        rx="6"
        className="text-border"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export const Icons = {
  logo: Logo,
};
