import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
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
  description?: string;
  imageUrl?: string;
  blank?: boolean;
  intro?: boolean;
  isCover?: boolean;
};

type CatalogueViewerProps = {
  pages: CataloguePage[];
  title?: string;
  description?: string;
  zoom?: number;
  soundOn?: boolean;
  showGrid?: boolean;
};

const BASE_W = 350;
const BASE_H = 500;
const PAGE_RATIO = BASE_H / BASE_W;

const FLIP_MS = 1500;
const SHIFT_MS = FLIP_MS;
const CENTER_COVERS = true;
const SHIFT_EASE = "cubic-bezier(0.645, 0.045, 0.355, 1)";
const OPEN_EASE = "cubic-bezier(0.1, 0.6, 0.3, 1)";

const STACK_RATIO = 0.09;
const STACK_LEAF = 2;
const BIND_W = 3;

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
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  });

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#fdf9f5] p-4 text-center text-sm text-gray-400">
        {alt}
      </div>
    );
  }

  return (
    <div className={`page-image-wrapper ${loaded ? "image-loaded" : ""}`}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        loading={eager ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
};

const CatalogueViewer = ({
  pages,
  title,
  description,
  zoom = 100,
  soundOn = true,
  showGrid = false,
}: CatalogueViewerProps) => {
  const bookRef = useRef<any>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pageSoundRef = useRef<HTMLAudioElement | null>(null);
  const liveRef = useRef({ isPortrait: false, total: 0, split: false });
  const lockRef = useRef(0);
  const forcedRef = useRef<number | null>(null);
  const [snap, setSnap] = useState({ front: false, back: false });
  const soundOnRef = useRef(soundOn);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundBufferRef = useRef<AudioBuffer | null>(null);
  const soundOffsetRef = useRef(0);
  const lastSoundRef = useRef(0);

  const [currentPage, setCurrentPage] = useState(0);
  const [layoutPage, setLayoutPage] = useState(0);
  const [lightboxPage, setLightboxPage] = useState<CataloguePage | null>(null);
  const [stageWidth, setStageWidth] = useState(1000);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [measured, setMeasured] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [bookHidden, setBookHidden] = useState(false);

  const inner = useMemo<CataloguePage[]>(() => {
    const list: CataloguePage[] = [
      {
        id: -2,
        title: title || pages[0]?.title || "Catalogue",
        description: description ?? pages[0]?.description,
        intro: true,
      },
      ...pages.slice(1, -1),
    ];
    if (list.length % 2 === 1) {
      list.push({ id: -1, title: "", blank: true });
    }
    return list;
  }, [pages, title, description]);

  const frontPage = pages[0];
  const backPage = pages[pages.length - 1];

  const bookPages = useMemo<CataloguePage[]>(
    () => (frontPage ? [frontPage, ...inner, backPage] : []),
    [frontPage, inner, backPage]
  );

  const innerTotal = inner.length;
  const total = bookPages.length;

  useEffect(() => {
    const audio = new Audio("/sounds/pageturn.mp3");
    audio.preload = "auto";
    audio.volume = 0.6;
    pageSoundRef.current = audio;

    let cancelled = false;
    const Ctx: typeof AudioContext | undefined =
      window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      fetch("/sounds/pageturn.mp3")
        .then((r) => r.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .then((buf) => {
          if (cancelled) return;
          const ch = buf.getChannelData(0);
          let i = 0;
          while (i < ch.length && Math.abs(ch[i]) < 0.02) i++;
          soundOffsetRef.current = Math.max(0, i / buf.sampleRate - 0.01);
          soundBufferRef.current = buf;
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      pageSoundRef.current = null;
      soundBufferRef.current = null;
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, []);

  const playSound = useCallback(() => {
    if (!soundOnRef.current) return;

    const now = performance.now();
    if (now - lastSoundRef.current < 300) return;
    lastSoundRef.current = now;

    const ctx = audioCtxRef.current;
    const buf = soundBufferRef.current;
    if (ctx && buf) {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      src.buffer = buf;
      src.playbackRate.value = 1.25;
      gain.gain.value = 0.6;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(0, soundOffsetRef.current);
      return;
    }

    const audio = pageSoundRef.current;
    if (!audio) return;
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
  const split = !isPortrait && total >= 4;
  const scale = zoom / 100;

  soundOnRef.current = soundOn;
  liveRef.current = { isPortrait, total, split };

  const chromeW = isPortrait ? 120 : 150;
  const maxPageW =
    (stageWidth - chromeW - 4) / ((isPortrait ? 1 : 2) + 2 * STACK_RATIO);

  const w = Math.max(140, Math.round(Math.min(BASE_W * scale, maxPageW)));
  const h = Math.round(w * PAGE_RATIO);

  const [settledW, setSettledW] = useState(w);
  useEffect(() => {
    const id = requestAnimationFrame(() => setSettledW(w));
    return () => cancelAnimationFrame(id);
  }, [w]);
  const resizing = settledW !== w;

  const k = w / BASE_W;
  const stackMax = w * STACK_RATIO;
  const leaves = Math.max(1, (total - 1) / 2);
  const leafUnit = Math.min(STACK_LEAF * k, stackMax / leaves);
  const stackPad = Math.ceil(leafUnit * leaves) + 2;

  const charmTop = Math.round(CHARM_TOP * k);
  const charmDrop = Math.round(CHARM_DROP * k);
  const topPad = isPortrait ? 0 : charmTop;
  const dropPad = isPortrait ? 0 : charmDrop;
  const rodTop = Math.round(8 * k);
  const rodBottom = Math.round(18 * k);
  const rodMid = h + charmTop + Math.round(2 * k) - rodTop - rodBottom;

  const getPageFlip = () => bookRef.current?.pageFlip?.();

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= total - 1;

  const layoutFirst = layoutPage === 0;
  const layoutLast = layoutPage >= total - 1;

  const spreadOf = (index: number) =>
    isPortrait || index === 0 ? index : index % 2 === 1 ? index : index - 1;

  const fToG = (fl: number) => {
    const count = liveRef.current.total;
    return fl === 0 ? 1 : fl >= count - 2 ? count - 1 : fl + 1;
  };

  const gToF = (g: number) => {
    if (g >= total - 1) return total - 2;
    if (g <= 1) return 0;
    const left = g % 2 === 1 ? g : g - 1;
    return left - 1;
  };

  const locked = () => performance.now() < lockRef.current;
  const lockFor = (ms: number) => {
    lockRef.current = performance.now() + ms;
  };

  const nextPage = () => {
    if (isLastPage) return;
    if (split) {
      if (locked()) return;
      playSound();
      if (currentPage === 0) {
        lockFor(FLIP_MS * 0.6);
        setLayoutPage(1);
        setCurrentPage(1);
        return;
      }
      setLayoutPage(currentPage >= total - 3 ? total - 1 : currentPage + 2);
      getPageFlip()?.flipNext();
      return;
    }
    playSound();
    setLayoutPage(
      Math.min(
        total - 1,
        isPortrait ? currentPage + 1 : currentPage === 0 ? 1 : currentPage + 2
      )
    );
    getPageFlip()?.flipNext();
  };

  const previousPage = () => {
    if (isFirstPage) return;
    if (split) {
      if (locked()) return;
      playSound();
      if (currentPage === 1) {
        lockFor(FLIP_MS * 0.6);
        setLayoutPage(0);
        setCurrentPage(0);
        return;
      }
      setLayoutPage(currentPage >= total - 1 ? total - 3 : currentPage - 2);
      getPageFlip()?.flipPrev();
      return;
    }
    playSound();
    setLayoutPage(
      Math.max(
        0,
        isPortrait ? currentPage - 1 : currentPage <= 1 ? 0 : currentPage - 2
      )
    );
    getPageFlip()?.flipPrev();
  };

  const goToPage = (index: number) => {
    const g = Math.max(0, Math.min(total - 1, index));
    if (g === currentPage) return;
    if (split) {
      const sOf = (x: number) =>
        x === 0
          ? 0
          : x >= total - 1
          ? total / 2
          : (spreadOf(x) - 1) / 2 + 1;
      const diff = sOf(g) - sOf(currentPage);
      if (diff === 0 || locked()) return;
      if (diff === 1) {
        nextPage();
        return;
      }
      if (diff === -1) {
        previousPage();
        return;
      }

      playSound();
      lockFor(FLIP_MS + 400);
      const toBack = g >= total - 1;
      const target = g === 0 || toBack ? g : spreadOf(g);
      const fl = g === 0 ? 0 : toBack ? total - 4 : gToF(g);
      const leaveFront = layoutPage === 0 && target !== 0;
      const leaveBack = layoutPage === total - 1 && target !== total - 1;
      setBookHidden(true);
      setTimeout(() => {
        const pf = getPageFlip();
        if (leaveFront || leaveBack) {
          setSnap({ front: leaveFront, back: leaveBack });
          setTimeout(() => setSnap({ front: false, back: false }), 150);
        }
        forcedRef.current = toBack ? null : target;
        pf?.turnToPage?.(fl);
        setIsFlipping(false);
        setLayoutPage(target);
        setCurrentPage(toBack ? total - 3 : target);
        requestAnimationFrame(() => {
          setBookHidden(false);
          if (toBack) {
            lastSoundRef.current = performance.now();
            pf?.flipNext?.();
          }
        });
        setTimeout(() => {
          forcedRef.current = null;
        }, 400);
      }, 190);
      return;
    }
    playSound();
    setLayoutPage(spreadOf(g));
    getPageFlip()?.flip(g);
  };
  const goToFirstPage = () => goToPage(0);
  const goToLastPage = () => goToPage(total - 1);

  const handleFlip = (event: { data: number }) => {
    if (liveRef.current.split) {
      const fl = event.data;
      const forced = forcedRef.current;
      if (forced !== null) {
        setCurrentPage(forced);
        setLayoutPage(forced);
        setIsFlipping(false);
        return;
      }
      setCurrentPage((prev) => (fl === 0 && prev === 0 ? 0 : fToG(fl)));
      setLayoutPage((prev) => (fl === 0 && prev === 0 ? 0 : fToG(fl)));
    } else {
      setCurrentPage(event.data);
      setLayoutPage(event.data);
    }
    setIsFlipping(false);
  };

  const handleChangeState = (e: { data: string }) => {
    const pf = getPageFlip();
    if (!pf) return;

    if (e.data === "read") {
      setIsFlipping(false);
      const idx = pf.getCurrentPageIndex();
      if (liveRef.current.split) {
        const forced = forcedRef.current;
        forcedRef.current = null;
        if (forced !== null) {
          setLayoutPage(forced);
          return;
        }
        setLayoutPage((prev) => (idx === 0 && prev === 0 ? 0 : fToG(idx)));
      } else {
        setLayoutPage(idx);
      }
      return;
    }
    if (e.data === "user_fold") {
      setIsFlipping(true);
      return;
    }
    if (e.data !== "flipping") return;
    setIsFlipping(true);
    playSound();

    setTimeout(() => {
      const { isPortrait: portrait, total: count, split: sp } = liveRef.current;
      const dir =
        pf.getFlipController?.()?.getCalculation?.()?.getDirection?.() ??
        pf.getRender?.()?.getDirection?.();
      if (dir === undefined || dir === null) return;
      const cur = pf.getCurrentPageIndex();
      if (sp) {
        if (forcedRef.current !== null) return;
        const nextFl = dir === 0 ? cur + 2 : Math.max(0, cur - 2);
        setLayoutPage(Math.max(1, Math.min(count - 1, fToG(nextFl))));
        return;
      }
      const next =
        dir === 0
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

  const behind = layoutPage;
  const ahead = Math.max(
    0,
    total - layoutPage - (isPortrait || layoutFirst ? 1 : 2)
  );
  const stackL = isPortrait ? 0 : (behind / 2) * leafUnit;
  const stackR = (ahead / 2) * leafUnit;
  const bindW = Math.max(2, Math.round(BIND_W * k));
  const stackTransition = resizing
    ? "none"
    : `left ${SHIFT_MS}ms ${SHIFT_EASE}, width ${SHIFT_MS}ms ${SHIFT_EASE}`;

  const pageBody = (
    page: CataloguePage,
    opts: { cover: boolean; left: boolean; hingeBack: boolean; eager: boolean }
  ) => (
    <>
      {page.intro ? (
        <div className="cb-intro">
          <h2 className="cb-intro-title">{page.title}</h2>
          {page.description && (
            <p className="cb-intro-desc">{page.description}</p>
          )}
        </div>
      ) : page.blank ? (
        <div className="h-full w-full" />
      ) : page.imageUrl ? (
        <PageImage src={page.imageUrl} alt={page.title} eager={opts.eager} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center border border-gray-200">
          <p className="text-xl font-semibold text-gray-500">{page.title}</p>
          <p className="mt-1 text-sm text-gray-300">Page {page.id}</p>
        </div>
      )}

      {!opts.cover && (
        <>
          <div
            aria-hidden
            className={`cb-gutter ${
              opts.left ? "cb-gutter--left" : "cb-gutter--right"
            }`}
          />
          <div
            aria-hidden
            className={`cb-edge ${
              opts.left ? "cb-edge--left" : "cb-edge--right"
            }`}
          />
        </>
      )}

      {opts.cover && (
        <>
          <div
            aria-hidden
            className={`cb-hinge ${
              opts.hingeBack ? "cb-hinge--back" : "cb-hinge--front"
            }`}
          />
          <div aria-hidden className="cb-gloss" />
        </>
      )}
    </>
  );

  const flipItems = split
    ? [
        { page: { id: -3, title: "", blank: true } as CataloguePage, g: -1, ghost: true },
        ...bookPages
          .slice(2, total - 1)
          .map((page, i) => ({ page, g: i + 2, ghost: false })),
        { page: { id: -4, title: "", blank: true } as CataloguePage, g: -2, ghost: false },
      ]
    : bookPages.map((page, index) => ({ page, g: index, ghost: false }));

  const leafShell = (
    angle: number,
    over: boolean,
    front: ReactNode,
    back: ReactNode,
    onClick: () => void,
    instant: boolean
  ) => (
    <div
      style={{
        position: "absolute",
        left: w,
        top: 0,
        width: w,
        height: "100%",
        perspective: 6000,
        perspectiveOrigin: "0% 50%",
        zIndex: over ? 3 : 0,
        opacity: bookHidden ? 0 : 1,
        transition: resizing
          ? "none"
          : `z-index ${instant ? 0 : 0}s linear ${instant ? 0 : FLIP_MS / 2}ms, opacity ${
              bookHidden ? 160 : 220
            }ms ease`,
        pointerEvents: over ? "auto" : "none",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transformOrigin: "0% 50%",
          transform: `rotateY(${angle}deg)`,
          transition:
            resizing || instant
              ? "none"
              : `transform ${FLIP_MS}ms ${SHIFT_EASE}`,
        }}
      >
        <div
          className="cb-page cb-face"
          style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}
        >
          {front}
        </div>
        <div
          className="cb-page cb-face"
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {back}
        </div>
      </div>
    </div>
  );

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
      style={{ "--cb-u": `${k}px` } as CSSProperties}
      className={`flex w-full flex-col items-center gap-4 ${
        isFullscreen ? "cb-fs justify-center bg-neutral-900 p-6" : ""
      }`}
    >
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

      <div className="flex items-center gap-4">
        <button
          onClick={previousPage}
          disabled={isFirstPage}
          aria-label="Previous page"
          title="Previous page"
          style={{ marginBottom: dropPad - topPad }}
          className="z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background shadow-md transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div
          className="relative overflow-hidden"
          style={{
            width: (isPortrait ? w : w * 2) + stackPad * 2,
            height: h + topPad + dropPad,
            flexShrink: 0,
          }}
        >
          <div
            className="absolute"
            style={{
              top: topPad,
              bottom: dropPad,
              left: stackPad,
              right: stackPad,
              transform: `translateX(${shiftX}px)`,
              transition: resizing
                ? "none"
                : `transform ${SHIFT_MS}ms ${shiftX === 0 ? OPEN_EASE : SHIFT_EASE}`,
            }}
          >
            <div
  aria-hidden
  className="cb-base"
  style={{
    left: baseLeft,
    width: baseWidth,
    transition: stackTransition,
    opacity: 0,
    pointerEvents: "none",
  }}
/>

            {isPortrait ? (
              <div
                aria-hidden
                className="cb-book-binding"
                style={{ left: baseLeft - bindW, width: bindW }}
              />
            ) : (
              <div
                aria-hidden
                className="cb-book-stack cb-book-stack--left"
                style={{
                  left: baseLeft - stackL,
                  width: stackL,
                  transition: stackTransition,
                }}
              />
            )}
            <div
              aria-hidden
              className="cb-book-stack cb-book-stack--right"
              style={{
                left: baseLeft + baseWidth,
                width: stackR,
                transition: stackTransition,
              }}
            />

            <div
              className={
                split &&
                (currentPage === 0 ||
                  currentPage >= total - 1 ||
                  layoutPage === 0 ||
                  layoutPage >= total - 1)
                  ? "cb-noshadow"
                  : undefined
              }
              style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                zIndex: 1,
                opacity: bookHidden ? 0 : 1,
                transition: `opacity ${bookHidden ? 160 : 220}ms ease`,
              }}
            >
              <style>{`.cb-noshadow .stf__outerShadow,.cb-noshadow .stf__innerShadow,.cb-noshadow .stf__hardShadow,.cb-noshadow .stf__hardInnerShadow{display:none!important}`}</style>
              {measured && (
                <HTMLFlipBook
                  key={`${w}x${h}-${isPortrait ? "p" : "l"}`}
                  ref={(instance: any) => {
                    bookRef.current = instance;
                  }}
                  className="catalogue-book"
                  style={{}}
                  width={w}
                  height={h}
                  size="fixed"
                  startPage={split ? gToF(currentPage) : currentPage}
                  minWidth={w}
                  maxWidth={w}
                  minHeight={h}
                  maxHeight={h}
                  usePortrait={isPortrait}
                  startZIndex={0}
                  autoSize={false}
                  maxShadowOpacity={0.35}
                  showCover={!split}
                  drawShadow={true}
                  flippingTime={FLIP_MS}
                  useMouseEvents={true}
                  mobileScrollSupport={true}
                  swipeDistance={30}
                  clickEventForward={false}
                  renderOnlyPageLengthChange={true}
                  disableFlipByClick={false}
                  onFlip={handleFlip}
                  onChangeState={handleChangeState}
                >
                  {flipItems.map(({ page, g, ghost }, index) => {
                    if (ghost) {
                      return (
                        <div
                          key={`${page.id}-${index}`}
                          data-density="soft"
                          className="relative h-full w-full"
                          style={{ background: "transparent" }}
                        />
                      );
                    }
                    const isCover =
                      !split &&
                      (page.isCover ?? (g === 0 || g === total - 1));
                    const isLeftPage = split
                      ? index % 2 === 0
                      : !isPortrait && g % 2 === 1;

                    return (
                      <div
                        key={`${page.id}-${index}`}
                        data-density={isCover ? "hard" : "soft"}
                        className="cb-page relative h-full w-full overflow-hidden"
                      >
                        {pageBody(page, {
                          cover: isCover,
                          left: isLeftPage,
                          hingeBack: !isPortrait && g !== 0,
                          eager: total <= 80 || Math.abs(g - currentPage) < 8,
                        })}
                      </div>
                    );
                  })}
                </HTMLFlipBook>
              )}

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

            {split && (
              <>
                {leafShell(
                  layoutFirst ? 0 : -180,
                  layoutFirst,
                  pageBody(bookPages[0], {
                    cover: true,
                    left: false,
                    hingeBack: false,
                    eager: true,
                  }),
                  pageBody(bookPages[1], {
                    cover: false,
                    left: true,
                    hingeBack: false,
                    eager: true,
                  }),
                  nextPage,
                  snap.front
                )}
                {leafShell(
                  layoutLast ? -180 : 0,
                  layoutLast,
                  pageBody({ id: -5, title: "", blank: true }, {
                    cover: false,
                    left: false,
                    hingeBack: false,
                    eager: true,
                  }),
                  pageBody(bookPages[total - 1], {
                    cover: true,
                    left: false,
                    hingeBack: true,
                    eager: true,
                  }),
                  previousPage,
                  snap.back
                )}
                {layoutPage === 1 && (
                  <div
                    onClick={previousPage}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: w,
                      height: "100%",
                      zIndex: 2,
                      cursor: "pointer",
                    }}
                  />
                )}
              </>
            )}

            {!isPortrait && (
              <div
                aria-hidden
                className="cb-charm"
                style={{
                  left: w,
                  top: -charmTop,
                }}
              >
                <div className="cb-charm-knot" />
                <div className="cb-charm-rod" style={{ height: rodTop }} />
                <div
                  className="cb-charm-rod cb-charm-rod--mid"
                  style={{
                    height: rodMid,
                    opacity: isOpenSpread ? 0 : 1,
                    transition: `opacity ${SHIFT_MS}ms ease`,
                  }}
                />
                <div className="cb-charm-rod" style={{ height: rodBottom }} />
                <div className="cb-charm-hang">
                  <span className="cb-charm-ring" />
                  <span className="cb-charm-ring" />
                  <svg
                    className="cb-charm-bird"
                    width={26 * k}
                    height={21 * k}
                    viewBox="0 0 32 26"
                  >
                    <polygon points="7,13 0,9 1,18" fill="#d96a0f" />
                    <ellipse cx="15" cy="14" rx="10" ry="8" fill="#f28c28" />
                    <circle cx="22" cy="9" r="6" fill="#f28c28" />
                    <ellipse cx="14" cy="15" rx="6" ry="4" fill="#d96a0f" />
                    <polygon points="27,8 32,10 27,12" fill="#ffc83d" />
                    <circle cx="23.5" cy="8" r="1.2" fill="#2b1a0a" />
                  </svg>
                  <span className="cb-charm-string" />
                  <span className="cb-charm-bead" />
                  <svg
                    className="cb-charm-loop"
                    width={15 * k}
                    height={21 * k}
                    viewBox="0 0 22 30"
                  >
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
