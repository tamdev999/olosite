import type React from "react";
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "olo-calculator": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        headline?: string;
        subheading?: string;
        cta?: string;
      };
    }
  }
}
