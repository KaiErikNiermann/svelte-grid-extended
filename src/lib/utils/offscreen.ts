/**
 * Styles that let the browser skip rendering a grid while it is away from the viewport:
 * `content-visibility: auto` skips the paint, layout and hit-testing of thousands of positioned
 * items while scrolling past them, and they stay in the accessibility tree and find-in-page.
 * The browser decides when to skip; `contain-intrinsic-size: auto none` keeps a skipped grid at
 * its last rendered size.
 *
 * It replaced toggling the property from an IntersectionObserver: on the exec host that switch
 * itself cost Firefox 15-20 slow frames per scroll of 20 grids x 200 items (3-5 with the native
 * property; Chromium 2 with either). The property also brings paint containment, which clips
 * whatever an item draws outside the grid and makes the grid the containing block of
 * `position: fixed` content inside it; the grid turns it off during a drag or resize, and
 * `skipOffscreen={false}` turns it off for good.
 */
export function offscreenCss(skip: boolean): string {
	return skip ? 'content-visibility: auto; contain-intrinsic-size: auto none;' : '';
}
