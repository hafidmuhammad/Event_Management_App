/**
 * Presentation screens (doorprize and awards display) use the "stage" theme:
 * deep violet, a warm amber accent, and type scaled up for a projector.
 *
 * The theme is applied to this wrapper only, so the dashboard keeps whatever
 * theme the user picked. The wrapper paints its own background and text colour
 * because <body> still follows the user's theme. Menus and dialogs portal to
 * <body> and therefore keep the user's theme, which is fine: these screens
 * have none.
 */
export default function PresentationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div data-theme="stage" className="min-h-screen bg-background text-ink">{children}</div>;
}
