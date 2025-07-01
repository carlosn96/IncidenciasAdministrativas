import type { ImgHTMLAttributes, SVGProps } from "react";

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
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.72 1.9-5.6 0-9.98-4.4-9.98-9.98s4.38-9.98 9.98-9.98c3.14 0 5.22 1.24 6.84 2.72l-2.76 2.76c-.85-.85-2.2-1.45-4.08-1.45-4.72 0-8.48 3.8-8.48 8.48s3.76 8.48 8.48 8.48c2.8 0 4.2-.8 5.2-1.75.8-.8.9-2.1.9-3.3z" />
    </svg>
  );
}
