import Link from "next/link";
import { FC, ReactElement } from "react";
import cn from "clsx";

export type LinkTabProps = {
  tabName: string;
  link: string;
  isCollapsed: boolean;
  isCurrent: boolean;
  startIcon?: ReactElement;
  endIcon?: ReactElement;
};

export const LinkTab: FC<LinkTabProps> = ({
  tabName,
  link,
  isCollapsed,
  isCurrent,
  startIcon,
  endIcon,
}) => {
  const isInternalLink = link && (link.startsWith("/") || link.startsWith("#"));

  return isInternalLink ? (
    <Link href={link}>
      <div
        className={cn(
          "group flex flex-row px-5 py-[15px] hover:bg-instillBlue50",
          {
            "gap-x-5": !isCollapsed,
          }
        )}
      >
        {startIcon ? <div className="px-1"> {startIcon}</div> : null}
        {isCollapsed ? null : (
          <p
            className={cn(
              "my-auto text-base leading-[28px] group-hover:text-instillBlue10",
              isCurrent ? "text-instillBlue50" : "text-instillGrey30"
            )}
          >
            {tabName}
          </p>
        )}
        {endIcon ? <div className="ml-auto">{endIcon}</div> : null}
      </div>
    </Link>
  ) : (
    <a
      className={cn(
        "group flex flex-row px-5 py-[15px] hover:bg-instillBlue50",
        {
          "gap-x-5": !isCollapsed,
        }
      )}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
    >
      {startIcon ? <div className="px-1"> {startIcon}</div> : null}
      {isCollapsed ? null : (
        <p
          className={cn(
            "my-auto text-base leading-[28px] group-hover:text-instillBlue10",
            isCurrent ? "text-instillBlue50" : "text-instillGrey30"
          )}
        >
          {tabName}
        </p>
      )}
      {endIcon ? <div className="ml-auto">{endIcon}</div> : null}
    </a>
  );
};