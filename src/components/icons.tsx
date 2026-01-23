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

interface GoogleIconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export function GoogleIcon({ 
  title = "Google", 
  className,
  ...props 
}: GoogleIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      aria-label={title}
      role="img"
      className={className}
      {...props}
    >
      <title>{title}</title>
      
      {/* Azul - parte superior derecha */}
      <path
        fill="#4285F4"
        d="M47.04 24.52c0-1.67-.15-3.28-.43-4.82H24v9.11h12.91c-.56 2.98-2.24 5.51-4.77 7.21v5.95h7.72c4.52-4.16 7.13-10.29 7.13-17.45z"
      />
      
      {/* Verde - parte inferior derecha */}
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.91-5.78l-7.72-5.95c-2.15 1.44-4.91 2.29-8.19 2.29-6.3 0-11.64-4.25-13.54-9.96H2.54v6.14C6.51 42.63 14.62 48 24 48z"
      />
      
      {/* Amarillo - parte inferior izquierda */}
      <path
        fill="#FBBC05"
        d="M10.46 28.6c-.48-1.44-.75-2.98-.75-4.6s.27-3.16.75-4.6v-6.14H2.54C.92 16.55 0 20.16 0 24s.92 7.45 2.54 10.74l7.92-6.14z"
      />
      
      {/* Rojo - parte superior izquierda */}
      <path
        fill="#EA4335"
        d="M24 9.56c3.55 0 6.74 1.22 9.25 3.61l6.93-6.93C35.91 2.25 30.48 0 24 0 14.62 0 6.51 5.37 2.54 13.26l7.92 6.14c1.9-5.71 7.24-9.96 13.54-9.96z"
      />
    </svg>
  );
}