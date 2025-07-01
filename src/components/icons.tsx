import type { ImgHTMLAttributes } from "react";

export function AppLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/assets/images/une-color.png"
      alt="Centro Universitario UNE Logo"
      {...props}
    />
  );
}

export function GoogleIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/assets/images/google.svg"
      alt="Google Logo"
      {...props}
    />
  );
}
