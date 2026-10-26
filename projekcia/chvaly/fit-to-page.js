// Fits the printed font size of a song page onto a single A4 page.
// Referenced by the generated song pages and copied next to them.
//
// The pure computations are kept separate from the 'beforeprint' listener,
// which is the only part that reads or writes the DOM. In Node (unit tests)
// there is no `window`, so the pure API is published on globalThis instead.
(() => {
  // Geometry constants - must match the CSS in song.css
  const PX_PER_MM = 96 / 25.4;
  const A4 = Object.freeze({ widthMm: 210, heightMm: 297 });
  const PAGE_MARGIN_MM = 10;
  const HTML_MARGIN_PX = 20;

  const mmToPx = (mm) => mm * PX_PER_MM;
  const printableSizePx = (pageSizeMm) =>
    mmToPx(pageSizeMm) - 2 * (mmToPx(PAGE_MARGIN_MM) + HTML_MARGIN_PX);
  const A4_PRINTABLE_WIDTH_PX = printableSizePx(A4.widthMm);
  const A4_PRINTABLE_HEIGHT_PX = printableSizePx(A4.heightMm);
  const fontSizeProperty = (medium) => `--${medium}-font-size`;

  const contentHeightPx = ({ marginTop, tableBottom, bodyTop, marginBottom }) =>
    marginTop + tableBottom - bodyTop + marginBottom;

  // Finds the largest integer font size in [minFontSize, maxFontSize] for which
  // `fits` returns true. Returns minFontSize when even the smallest size does
  // not fit, and maxFontSize when even the largest one does.
  const findLargestFittingFontSize = (minFontSize, maxFontSize, fits) => {
    let low = minFontSize;
    let high = maxFontSize;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      [low, high] = fits(middle) ? [middle, high] : [low, middle - 1];
    }
    return low;
  };

  const fitToPage = Object.freeze({
    PX_PER_MM,
    A4,
    PAGE_MARGIN_MM,
    HTML_MARGIN_PX,
    A4_PRINTABLE_WIDTH_PX,
    A4_PRINTABLE_HEIGHT_PX,
    mmToPx,
    printableSizePx,
    fontSizeProperty,
    contentHeightPx,
    findLargestFittingFontSize,
  });

  if (typeof window === 'undefined') {
    globalThis.fitToPage = fitToPage;
    return;
  }

  window.addEventListener('beforeprint', () => {
    const {documentElement: root, body} = document;
    const table = body.querySelector('table');
    if (!table) return;
    const rootStyle = getComputedStyle(root);
    const minFontSize = Number(rootStyle.getPropertyValue('--print-min-font-size-px'));
    const maxFontSize = Number(rootStyle.getPropertyValue('--print-max-font-size-px'));
    const bodyStyle = getComputedStyle(body);
    const marginTop = Number.parseFloat(bodyStyle.marginTop);
    const marginBottom = Number.parseFloat(bodyStyle.marginBottom);
    const screenFontProperty = fontSizeProperty('screen');
    const printFontProperty = fontSizeProperty('print');
    const previousScreenFontSize = rootStyle.getPropertyValue(screenFontProperty);
    const previousBodyWidth = body.style.width;

    // Measure as printed: print styles are already active in some browsers,
    // otherwise imitate them by constraining the width to the printed content width.
    if (!matchMedia('print').matches) {
      body.style.width = A4_PRINTABLE_WIDTH_PX + 'px';
    }
    const setFontSize = (property, size) => root.style.setProperty(property, size + 'px');
    const contentHeightFor = (fontSize) => {
      setFontSize(screenFontProperty, fontSize);
      setFontSize(printFontProperty, fontSize);
      return contentHeightPx({
        marginTop,
        marginBottom,
        tableBottom: table.getBoundingClientRect().bottom,
        bodyTop: body.getBoundingClientRect().top,
      });
    };
    // Find the largest font size (from the user defined bounds) that still fits
    // onto a single printed page with the current chord space setting
    const printFontSize = findLargestFittingFontSize(
      minFontSize,
      maxFontSize,
      (fontSize) => contentHeightFor(fontSize) <= A4_PRINTABLE_HEIGHT_PX,
    );
    setFontSize(printFontProperty, printFontSize);
    console.log('Print font size:', printFontSize);
    // The screen view keeps the font size chosen by the user, only print is affected
    // (per CSSOM, setting a property to the empty string removes it)
    root.style.setProperty(screenFontProperty, previousScreenFontSize);
    body.style.width = previousBodyWidth;
  });
})();
