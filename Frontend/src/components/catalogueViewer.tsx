import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import "./catalogueViewer.css";

type CataloguePage = {
  id: number;
  title: string;
  imageUrl?: string;
  blank?: boolean;
  isCover?: boolean;
};

type CatalogueViewerProps = {
  pages: CataloguePage[];
  zoom?: number;
  soundOn?: boolean;
  showGrid?: boolean;
};

const BASE_W = 350;
const BASE_H = 500;
const DEFAULT_RATIO = BASE_H / BASE_W;
const PAGE_RATIO = BASE_H / BASE_W;
const FILL_TOLERANCE = 0.15;

// Slower, controlled flip. Increase for slower, decrease for faster.
const FLIP_MS = 1500;
// Cover-centering slide lasts exactly as long as the flip
const SHIFT_MS = FLIP_MS;
const CENTER_COVERS = true;

// Shared easing, room beside the book for page-stack edges, stack sizing
const SHIFT_EASE = "cubic-bezier(0.645, 0.045, 0.355, 1)";
const STACK_PAD = 16; // px of room each side of the book for the stack edges
const STACK_MAX = 14; // max stack thickness in px
const STACK_STEP = 1.1; // px of thickness per page

// Bookmark charm: room above the book for the knot, below for the hanging charm
const CHARM_TOP = 16;
const CHARM_DROP = 110;

const PageImage = ({
  src,
  alt,
  eager,
}: {
  src: string;
  alt: string;
  eager: boolean;
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`page-image-wrapper ${loaded ? "image-loaded" : ""}`}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        loading={eager ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
      />
    </div>
  );
};


const CatalogueViewer = ({
  pages,
  zoom = 100,
  soundOn = true,
  showGrid = false,
}: CatalogueViewerProps) => {
  const bookRef = useRef<any>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pageSoundRef = useRef<HTMLAudioElement | null>(null);
  // react-pageflip registers its handlers once, so they must read live
  // values through a ref instead of closing over stale props/state
  const liveRef = useRef({ isPortrait: false, total: 0 });
  const soundOnRef = useRef(soundOn);

  const [currentPage, setCurrentPage] = useState(0);
  // Where the book is heading (updates when a flip STARTS, not when it ends)
  const [layoutPage, setLayoutPage] = useState(0);
  const [lightboxPage, setLightboxPage] = useState<CataloguePage | null>(null);
  const [stageWidth, setStageWidth] = useState(1000);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // The book is only created once the real container width is known, so it
  // never starts at the placeholder size and then gets re-created at the real one.
  const [measured, setMeasured] = useState(false);
  // True while a page is turning or being dragged; the spine overlay hides then
  const [isFlipping, setIsFlipping] = useState(false);

  const bookPages = useMemo<CataloguePage[]>(() => {
    if (pages.length > 2 && pages.length % 2 === 1) {
      const copy = [...pages];
      copy.splice(copy.length - 1, 0, {
        id: -1,
        title: "",
        blank: true,
      });
      return copy;
    }
    return pages;
  }, [pages]);

  const total = bookPages.length;

useEffect(() => {
  const audio = new Audio("/sounds/pageturn.mp3");
  audio.preload = "auto";
  audio.volume = 0.6;
  pageSoundRef.current = audio;

  return () => {
    pageSoundRef.current = null;
  };
}, []);

const playSound = useCallback(() => {
  const audio = pageSoundRef.current;
  if (!audio) return;

  if (!soundOnRef.current) {
    audio.pause();
    audio.currentTime = 0;
    return;
  }

  audio.currentTime = 0;
  audio.play().catch(() => {});
}, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      setStageWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    setStageWidth(el.clientWidth);
    setMeasured(true);

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const isPortrait = stageWidth < 720;
  const scale = zoom / 100;

  // Keep the ref in sync on every render so playSound always reads the live value
  soundOnRef.current = soundOn;

  liveRef.current = { isPortrait, total };

  // The charm only exists in the two-page (landscape) view
  const topPad = isPortrait ? 0 : CHARM_TOP;
  const dropPad = isPortrait ? 0 : CHARM_DROP;

  // fit the book inside the available width (also reserves the stack padding)
  const reservedSides = (isPortrait ? 120 : 150) + STACK_PAD * 2;
  const maxPageW = isPortrait
    ? stageWidth - reservedSides
    : (stageWidth - reservedSides) / 2;

  const w = Math.max(
    140,
    Math.round(Math.min(BASE_W * scale, maxPageW))
  );
  const h = Math.round(w * PAGE_RATIO);

  const getPageFlip = () => bookRef.current?.pageFlip?.();

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= total - 1;

  // Layout follows the flip target, not the finished flip
  const layoutFirst = layoutPage === 0;
  const layoutLast = layoutPage >= total - 1;

  const nextPage = () => {
    if (isLastPage) return;
    getPageFlip()?.flipNext();
  };

  const previousPage = () => {
    if (isFirstPage) return;
    getPageFlip()?.flipPrev();
  };

  const goToFirstPage = () => getPageFlip()?.flip(0);
  const goToLastPage = () => getPageFlip()?.flip(total - 1);
  const goToPage = (index: number) => getPageFlip()?.flip(index);

  const handleFlip = (event: { data: number }) => {
    setCurrentPage(event.data);
    setLayoutPage(event.data);
    setIsFlipping(false);
    playSound(); // click, drag, swipe, buttons, keyboard – everything
  };

  // Predict the target page when a flip STARTS so the plate, stack, charm and
  // centering move together with the animation instead of snapping at the end
  const handleChangeState = (e: { data: string }) => {
    const pf = getPageFlip();
    if (!pf) return;

    if (e.data === "read") {
      // flip finished or was cancelled (drag released back): resync
      setIsFlipping(false);
      setLayoutPage(pf.getCurrentPageIndex());
      return;
    }
    if (e.data === "user_fold") {
      setIsFlipping(true); // page is being dragged across the spine
      return;
    }
    if (e.data !== "flipping") return;
    setIsFlipping(true);

    setTimeout(() => {
      const { isPortrait: portrait, total: count } = liveRef.current;
      const dir = pf
        .getFlipController?.()
        ?.getCalculation?.()
        ?.getDirection?.();
      if (dir === undefined || dir === null) return; // fallback: sync at end of flip
      const cur = pf.getCurrentPageIndex();
      const next =
        dir === 0 // forward
          ? cur === 0 && !portrait
            ? 1
            : cur + (portrait ? 1 : 2)
          : portrait
          ? cur - 1
          : cur <= 1
          ? 0
          : cur - 2;
      setLayoutPage(Math.max(0, Math.min(count - 1, next)));
    }, 0);
  };

  // Keyboard
  useEffect(() => {
    if (showGrid) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPage();
      else if (e.key === "ArrowLeft") previousPage();
      else if (e.key === "Home") goToFirstPage();
      else if (e.key === "End") goToLastPage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!pages.length) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">No catalogue pages available.</p>
      </div>
    );
  }

  if (showGrid) {
    return (
      <div className="w-full max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => setLightboxPage(page)}
              className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
            >
              {page.imageUrl ? (
                <img
                  src={page.imageUrl}
                  alt={page.title}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center bg-muted">
                  <span className="text-xs text-muted-foreground">
                    {page.title}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 text-center text-xs text-white opacity-0 transition group-hover:opacity-100">
                Page {page.id}
              </div>
            </button>
          ))}
        </div>

        {lightboxPage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightboxPage(null)}
          >
            <button
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              onClick={() => setLightboxPage(null)}
            >
              <X className="h-5 w-5" />
            </button>
            {lightboxPage.imageUrl && (
              <img
                src={lightboxPage.imageUrl}
                alt={lightboxPage.title}
                className="max-h-[90vh] max-w-full rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  let shiftX = 0;
  if (CENTER_COVERS && !isPortrait) {
    if (layoutFirst) shiftX = -w / 2;
    else if (layoutLast) shiftX = w / 2;
  }

  const isOpenSpread = !layoutFirst && !layoutLast;

  let baseLeft = 0;
  let baseWidth = w * 2;
  if (isPortrait) {
    baseWidth = w;
  } else if (layoutFirst) {
    baseLeft = w;
    baseWidth = w;
  } else if (layoutLast) {
    baseWidth = w;
  }

  // Page-stack thickness on each side (left = turned pages, right = pages ahead)
  const behind = layoutPage;
  const ahead = Math.max(
    0,
    total - layoutPage - (isPortrait || layoutFirst ? 1 : 2)
  );
  const stackL = Math.min(STACK_MAX, behind * STACK_STEP);
  const stackR = Math.min(STACK_MAX, ahead * STACK_STEP);
  const stackTransition = `left ${SHIFT_MS}ms ${SHIFT_EASE}, width ${SHIFT_MS}ms ${SHIFT_EASE}, opacity ${SHIFT_MS}ms`;

  const label = isFirstPage
    ? "Front cover"
    : isLastPage
    ? "Back cover"
    : isPortrait
    ? `Page ${currentPage + 1}`
    : `Pages ${currentPage + 1} – ${currentPage + 2}`;

  return (
    <div
      ref={stageRef}
      className={`flex w-full flex-col items-center gap-4 ${
        isFullscreen ? "cb-fs justify-center bg-neutral-900 p-6" : ""
      }`}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-background/80 px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur">
          {label} · {currentPage + 1} / {total}
        </div>
        <button
          onClick={toggleFullscreen}
          aria-label="Toggle fullscreen"
          title="Fullscreen"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-sm transition hover:bg-muted"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Book + side buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={previousPage}
          disabled={isFirstPage}
          aria-label="Previous page"
          title="Previous page"
          // keeps the arrow level with the middle of the book, not the charm area
          style={{ marginBottom: dropPad - topPad }}
          className="z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background shadow-md transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Stage: exact pixel box — never grows, never scrolls */}
        <div
          className="relative overflow-hidden"
          style={{
            // widened by the stack padding, heightened by the charm room
            width: (isPortrait ? w : w * 2) + STACK_PAD * 2,
            height: h + topPad + dropPad,
            flexShrink: 0,
          }}
        >
          {/* Sliding wrapper – centres the covers (animated) */}
          <div
            className="absolute"
            style={{
              top: topPad,
              bottom: dropPad,
              left: STACK_PAD,
              right: STACK_PAD,
              transform: `translateX(${shiftX}px)`,
              transition: `transform ${SHIFT_MS}ms ${SHIFT_EASE}`,
            }}
          >
            {/* Static backing plate: soft shadow lives here, NOT on the pages */}
            <div
              aria-hidden
              className="cb-base"
              style={{
                left: baseLeft,
                width: baseWidth,
                transition: `left ${SHIFT_MS}ms ${SHIFT_EASE}, width ${SHIFT_MS}ms ${SHIFT_EASE}`,
              }}
            />

            {/* Page-stack edges */}
            <div
              aria-hidden
              className="cb-book-stack cb-book-stack--left"
              style={{
                left: baseLeft - stackL,
                width: stackL,
                opacity: stackL > 0 ? 1 : 0,
                transition: stackTransition,
              }}
            />
            <div
              aria-hidden
              className="cb-book-stack cb-book-stack--right"
              style={{
                left: baseLeft + baseWidth,
                width: stackR,
                opacity: stackR > 0 ? 1 : 0,
                transition: stackTransition,
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
              }}
            >
              {measured && (
              <HTMLFlipBook
                // remount when the size/orientation changes, keep current page
                // (the key makes that true: react-pageflip only reads
                // size/orientation when it is created)
                key={`${w}x${h}-${isPortrait ? "p" : "l"}`}
                ref={(instance: any) => {
                  bookRef.current = instance;
                }}
                className="catalogue-book"
                style={{}}
                width={w}
                height={h}
                size="fixed"
                startPage={currentPage}
                minWidth={w}
                maxWidth={w}
                minHeight={h}
                maxHeight={h}
                usePortrait={isPortrait}
                startZIndex={0}
                autoSize={false}
                maxShadowOpacity={0.35}
                showCover={true}
                drawShadow={true}
                flippingTime={FLIP_MS}
                useMouseEvents={true}
                mobileScrollSupport={true}
                swipeDistance={30}
                clickEventForward={false}
                // With false, every re-render (including the state updates at
                // the start/end of a flip) made react-pageflip rebuild all
                // pages mid-animation, which blanked the pages near the covers.
                renderOnlyPageLengthChange={true}
                disableFlipByClick={false}
                onFlip={handleFlip}
                onChangeState={handleChangeState}
              >
                {bookPages.map((page, index) => {
                  const isCover = page.isCover ?? (index === 0 || index === total - 1);
                  // with showCover: even index = right page, odd = left page
                  const isLeftPage = index % 2 === 1;

                  return (
                    <div
                      key={`${page.id}-${index}`}
                      // hard covers flip like real cardboard
                      data-density={isCover ? "hard" : "soft"}
                      className="cb-page relative h-full w-full overflow-hidden"
                    >
                      {page.blank ? (
                        <div className="h-full w-full" />
                      ) : page.imageUrl ? (
                        <PageImage
                          src={page.imageUrl}
                          alt={page.title}
                          eager={Math.abs(index - currentPage) < 6}
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center border border-gray-200">
                          <p className="text-xl font-semibold text-gray-500">
                            {page.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-300">
                            Page {page.id}
                          </p>
                        </div>
                      )}

                      {/* Inner pages: binding curve + soft outer edge */}
                      {!isCover && (
                        <>
                          <div
                            aria-hidden
                            className={`cb-gutter ${
                              isLeftPage ? "cb-gutter--left" : "cb-gutter--right"
                            }`}
                          />
                          <div
                            aria-hidden
                            className={`cb-edge ${
                              isLeftPage ? "cb-edge--left" : "cb-edge--right"
                            }`}
                          />
                        </>
                      )}

                      {/* Hard cover: spine hinge + soft gloss */}
                      {isCover && (
                        <>
                          <div
                            aria-hidden
                            className={`cb-hinge ${
                              index === 0 ? "cb-hinge--front" : "cb-hinge--back"
                            }`}
                          />
                          <div aria-hidden className="cb-gloss" />
                        </>
                      )}
                    </div>
                  );
                })}
              </HTMLFlipBook>
              )}

              {/* Centre spine crease – only while the book is open */}
              {!isPortrait && (
                <div
                  aria-hidden
                  className="cb-spine transition-opacity"
                  style={{
                    opacity: isOpenSpread && !isFlipping ? 1 : 0,
                    transitionDuration: isFlipping ? "120ms" : "450ms",
                  }}
                />
              )}
            </div>

            {/* Bookmark: knot on top, full-height ribbon along the spine,
                hanging bird charm below (open spread, landscape only).
                Sits AFTER the flip book so it draws on top of the pages. */}
            {!isPortrait && (
              <div
                aria-hidden
                className="cb-charm"
                style={{
                  left: w,
                  top: -CHARM_TOP,
                }}
              >
                <div className="cb-charm-knot" />
                {/* Rod = short top stub + long middle + short bottom stub. The long middle
                    only shows while the book is closed; open spreads keep just the stubs. */}
                <div className="cb-charm-rod" style={{ height: 8 }} />
                <div
                  className="cb-charm-rod cb-charm-rod--mid"
                  style={{
                    height: h + CHARM_TOP + 2 - 26,
                    opacity: isOpenSpread ? 0 : 1,
                    transition: `opacity ${SHIFT_MS}ms ease`,
                  }}
                />
                <div className="cb-charm-rod" style={{ height: 18 }} />
                <div className="cb-charm-hang">
                  <span className="cb-charm-ring" />
                  <span className="cb-charm-ring" />
                  <svg className="cb-charm-bird" width="26" height="21" viewBox="0 0 32 26">
                    <polygon points="7,13 0,9 1,18" fill="#d96a0f" />
                    <ellipse cx="15" cy="14" rx="10" ry="8" fill="#f28c28" />
                    <circle cx="22" cy="9" r="6" fill="#f28c28" />
                    <ellipse cx="14" cy="15" rx="6" ry="4" fill="#d96a0f" />
                    <polygon points="27,8 32,10 27,12" fill="#ffc83d" />
                    <circle cx="23.5" cy="8" r="1.2" fill="#2b1a0a" />
                  </svg>
                  <span className="cb-charm-string" />
                  <span className="cb-charm-bead" />
                  <svg className="cb-charm-loop" width="15" height="21" viewBox="0 0 22 30">
                    <path
                      d="M11 2 C2 8, 2 22, 11 28 C20 22, 20 8, 11 2 Z"
                      fill="none"
                      stroke="#f28c28"
                      strokeWidth="3"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={nextPage}
          disabled={isLastPage}
          aria-label="Next page"
          title="Next page"
          style={{ marginBottom: dropPad - topPad }}
          className="z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background shadow-md transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Bottom navigation */}
      <div className="flex w-full max-w-md items-center gap-2 px-4">
        <button
          onClick={goToFirstPage}
          disabled={isFirstPage}
          aria-label="Go to first page"
          title="First page"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        <input
          type="range"
          min={0}
          max={total - 1}
          value={currentPage}
          onChange={(e) => goToPage(Number(e.target.value))}
          aria-label="Jump to page"
          className="h-1 w-full cursor-pointer accent-primary"
        />

        <button
          onClick={goToLastPage}
          disabled={isLastPage}
          aria-label="Go to last page"
          title="Last page"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {/* Thumbnail strip */}
      {bookPages.some((p) => p.imageUrl) && (
        <div className="flex w-full max-w-3xl gap-2 overflow-x-auto px-4 pb-2">
          {bookPages.map((page, index) => {
            const active =
              index === currentPage ||
              (!isPortrait && !isFirstPage && index === currentPage + 1);
            return (
              <button
                key={`thumb-${page.id}-${index}`}
                onClick={() => goToPage(index)}
                aria-label={`Go to page ${index + 1}`}
                className={`relative h-16 w-12 shrink-0 overflow-hidden rounded border bg-white transition ${
                  active
                    ? "ring-2 ring-primary ring-offset-1"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                {page.imageUrl && !page.blank ? (
                  <img
                    src={page.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CatalogueViewer;
