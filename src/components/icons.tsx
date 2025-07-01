import { cn } from "@/lib/utils";
import type { SVGProps, ImgHTMLAttributes } from "react";

export function AppLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/assets/images/une-color.png"
      alt="Centro Universitario UNE Logo"
      {...props}
    />
  );
}

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Google</title>
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.98-4.66 1.98-3.57 0-6.47-2.92-6.47-6.55s2.9-6.55 6.47-6.55c2.04 0 3.32.83 4.1 1.62l2.55-2.55C17.53 3.48 15.34 2.48 12.48 2.48c-5.48 0-9.94 4.43-9.94 9.91s4.46 9.91 9.94 9.91c5.19 0 9.59-3.43 9.59-9.71 0-.63-.05-1.22-.16-1.78Z"
      />
    </svg>
  );
}
