"use client";

import {
  Tab as AriaTab,
  composeRenderProps,
  TabList,
  TabPanel,
  Tabs,
  type TabProps,
} from "react-aria-components";

export { Tabs, TabList, TabPanel };

const tabBase =
  "group -mb-px flex cursor-pointer items-center gap-2 border-b-2 border-transparent pb-2.5 pt-1 text-sm text-[#a89f95] outline-none transition-colors hover:text-[#6f665c] data-selected:border-[#bc6c47] data-selected:font-medium data-selected:text-[#2b2621]";

export function Tab({
  badge,
  children,
  className,
  ...props
}: TabProps & { badge?: number; children: React.ReactNode }) {
  return (
    <AriaTab
      className={composeRenderProps(className, (resolved) =>
        [tabBase, resolved].filter(Boolean).join(" "),
      )}
      {...props}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="rounded-full bg-[#efe4d8] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#a1542f] group-data-selected:bg-[#bc6c47] group-data-selected:text-[#faf7f2]">
          {badge}
        </span>
      )}
    </AriaTab>
  );
}
