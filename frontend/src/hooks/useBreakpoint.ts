import { Grid } from "antd";

/**
 * Responsive breakpoint helper.
 *
 * Wraps Ant Design's `Grid.useBreakpoint()` so components have a single source
 * of truth for screen-size logic. Avoid reading `window.innerWidth` directly in
 * render — AntD handles resize listeners and SSR-safety for us.
 *
 * Breakpoints (AntD defaults, also exported as `bp` from theme.ts):
 * - xs:   < 576px  (small phones, iPhone SE)
 * - sm:   ≥ 576px  (phones)
 * - md:   ≥ 768px  (tablets)
 * - lg:   ≥ 992px  (desktop)
 * - xl:   ≥ 1200px (large desktop)
 * - xxl:  ≥ 1600px
 *
 * Usage:
 *   const screens = useBreakpoint();
 *   const isMobile = !screens.md;       // true when < 768
 *   const isPhone  = !screens.sm;       // true when < 576
 */
export const useBreakpoint = () => Grid.useBreakpoint();

/**
 * Convenience: true when viewport is phone-sized (< md, i.e. < 768px).
 * Most "is this mobile?" checks in admin UI should use this.
 */
export const useIsMobile = (): boolean => {
  const screens = Grid.useBreakpoint();
  return !screens.md;
};
