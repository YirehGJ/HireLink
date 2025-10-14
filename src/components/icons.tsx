
import type { SVGProps } from "react";

function Logo(props: SVGProps<SVGSVGElement>) {
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

function Google(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      {...props}
    >
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      <path d="M1 1h22v22H1z" fill="none" />
    </svg>
  );
}

export const Icons = {
  logo: Logo,
  google: Google,
};
