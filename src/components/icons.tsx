import type { ImgHTMLAttributes, SVGProps } from "react";
import { cn } from "@/lib/utils";

export function AppLogo({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/assets/images/une-color.png"
      alt="Centro Universitario UNE Logo"
      className={cn("object-contain", className)}
      {...props}
    />
  );
}

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 18 18"
      aria-hidden="true"
      {...props}
    >
      <path
        fill="#4285F4"
        d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z"
      />
      <path
        fill="#34A853"
        d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.96409 10.71C3.78409 10.1705 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.82955 3.96409 7.29H0.957275C0.347727 8.55 0 9.94545 0 11.475C0 13.0045 0.347727 14.3991 0.957275 15.6591L3.96409 13.3273V10.71Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.57955C10.3214 3.57955 11.5077 4.02409 12.4405 4.925L15.0218 2.34364C13.4673 0.891818 11.43 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
      />
    </svg>
  );
}
