import * as React from "react";
import { IconBase, IconBaseProps } from "./IconBase";

export const CubeOutline = React.forwardRef<
  SVGSVGElement,
  Omit<IconBaseProps, "viewBox" | "children">
>((props, ref) => {
  const { className, ...passThrough } = props;
  return (
    <IconBase
      {...passThrough}
      ref={ref}
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        d="M9.75 20.75L11.223 21.5683C11.5066 21.7259 11.6484 21.8047 11.7986 21.8355C11.9315 21.8629 12.0685 21.8629 12.2015 21.8355C12.3516 21.8047 12.4934 21.7259 12.777 21.5683L14.25 20.75M5.25 18.25L3.82297 17.4572C3.52346 17.2908 3.37368 17.2076 3.26463 17.0893C3.16816 16.9846 3.09515 16.8605 3.05048 16.7253C3 16.5725 3 16.4012 3 16.0586V14.5M3 9.5V7.94145C3 7.5988 3 7.42748 3.05048 7.27468C3.09515 7.13951 3.16816 7.01543 3.26463 6.91074C3.37368 6.7924 3.52345 6.7092 3.82297 6.5428L5.25 5.75M9.75 3.25L11.223 2.43168C11.5066 2.27412 11.6484 2.19535 11.7986 2.16446C11.9315 2.13713 12.0685 2.13713 12.2015 2.16446C12.3516 2.19535 12.4934 2.27412 12.777 2.43168L14.25 3.25M18.75 5.75L20.177 6.54279C20.4766 6.7092 20.6263 6.7924 20.7354 6.91073C20.8318 7.01542 20.9049 7.13951 20.9495 7.27468C21 7.42748 21 7.5988 21 7.94145V9.5M21 14.5V16.0586C21 16.4012 21 16.5725 20.9495 16.7253C20.9049 16.8605 20.8318 16.9846 20.7354 17.0893C20.6263 17.2076 20.4766 17.2908 20.177 17.4572L18.75 18.25M9.75 10.75L12 12M12 12L14.25 10.75M12 12V14.5M3 7L5.25 8.25M18.75 8.25L21 7M12 19.5V22"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
});
CubeOutline.displayName = "IconCubeOutline";