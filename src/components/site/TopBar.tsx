/**
 * A backdrop behind the fixed menu and cart controls.
 *
 * Both float over the page, so headings were running underneath them at every
 * width. This sits above the content but below the controls (which are z-40
 * and z-45), giving them a surface to sit on without changing their position.
 */
export function TopBar() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[39] h-20 border-b border-bronze/15 bg-paper/95 backdrop-blur-sm sm:h-24"
    />
  );
}

export default TopBar;
