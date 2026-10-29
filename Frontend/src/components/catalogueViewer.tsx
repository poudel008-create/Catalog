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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";
import {
  CatalogueControls,
  CatalogueGrid,
  CataloguePageContent,
  type CataloguePage,
} from "./catalogueViewerParts";
import "./catalogueViewer.css";

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
  const backCoverTransitionTimerRef = useRef<number | null>(null);
  const liveRef = useRef({ isPortrait: false, total: 0, split: false });
  const lockRef = useRef(0);
  const forcedRef = useRef<number | null>(null);
  const [snap, setSnap] = useState({ front: false, back: false });
  const soundOnRef = useRef(soundOn);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundBufferRef = useRef<AudioBuffer | null>(null);
  const soundOffsetRef = useRef(0);
  const lastSoundRef = useRef(0);
  const foldSoundRef = useRef(false);
  const resizingBookRef = useRef(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [layoutPage, setLayoutPage] = useState(0);
  const [stageWidth, setStageWidth] = useState(1000);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [measured, setMeasured] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [backCoverTransition, setBackCoverTransition] = useState(false);
  const [bookHidden, setBookHidden] = useState(false);
  const [spineHost, setSpineHost] = useState<HTMLElement | null>(null);

  useEffect(
    () => () => {
      if (backCoverTransitionTimerRef.current !== null) {
        window.clearTimeout(backCoverTransitionTimerRef.current);
      }
    },
    []
  );

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

    const measure = () => {
      const style = window.getComputedStyle(el);
      setStageWidth(
        el.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight)
      );
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    measure();
    setMeasured(true);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
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

  useEffect(() => {
    if (!measured || isPortrait || showGrid || !pages.length) return;

    const stage = stageRef.current;
    if (!stage) return;

    const updateSpineHost = () => {
      const host = stage.querySelector<HTMLElement>(
        ".catalogue-book .stf__block"
      );
      if (host) setSpineHost(host);
    };
    const observer = new MutationObserver(updateSpineHost);
    observer.observe(stage, { childList: true, subtree: true });
    updateSpineHost();

    return () => observer.disconnect();
  }, [isPortrait, measured, pages.length, showGrid]);

  soundOnRef.current = soundOn;
  liveRef.current = { isPortrait, total, split };

  const chromeW = isPortrait ? 120 : 150;
  const maxPageW =
    (stageWidth - chromeW - 4) / ((isPortrait ? 1 : 2) + 2 * STACK_RATIO);

  const w = Math.max(140, Math.round(Math.min(BASE_W * scale, maxPageW)));
  const h = Math.round(w * PAGE_RATIO);

  const bookSizeRef = useRef({ w, h });
  useEffect(() => {
    const previousSize = bookSizeRef.current;
    if (previousSize.w === w && previousSize.h === h) return;
    bookSizeRef.current = { w, h };

    const flipBook = bookRef.current?.pageFlip?.();
    const element = stageRef.current?.querySelector<HTMLElement>(".catalogue-book");
    if (!flipBook || !element) return;

    resizingBookRef.current = true;
    try {
      const settings = flipBook.getSettings();
      settings.width = w;
      settings.height = h;
      settings.minWidth = w;
      settings.maxWidth = w;
      settings.minHeight = h;
      settings.maxHeight = h;
      element.style.minWidth = `${w * (isPortrait ? 1 : 2)}px`;
      element.style.minHeight = `${h}px`;
      flipBook.update();
    } finally {
      resizingBookRef.current = false;
    }
  }, [w, h, isPortrait]);

  const [settledW, setSettledW] = useState(w);
  useEffect(() => {
    const id = requestAnimationFrame(() => setSettledW(w));
    return () => cancelAnimationFrame(id);
  }, [w]);
  const resizing = settledW !== w;

  const k = w / BASE_W;
  const stackMax = w * STACK_RATIO;
  const leaves = Math.max(1, split ? (total - 2) / 2 : (total - 1) / 2);
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

  const flipPrev = () => {
    const flipBook = getPageFlip();
    if (isPortrait) {
      const rect = flipBook?.getRender?.()?.getRect?.();
      const controller = flipBook?.getFlipController?.();
      if (rect && controller) {
        controller.flip({ x: rect.left + 10, y: rect.top + 1 });
        return;
      }
    }
    flipBook?.flipPrev();
  };

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= total - 1;

  const layoutFirst = layoutPage === 0;
  const layoutLast = layoutPage >= total - 1;
  const backCoverSide = isPortrait && currentPage >= total - 1;

  const spreadOf = (index: number) =>
    isPortrait || index === 0 ? index : index % 2 === 1 ? index : index - 1;

  const fToG = (fl: number) => {
    const count = liveRef.current.total;
    return Math.min(count - 2, fl + 1);
  };

  const gToF = (g: number) => {
    if (g >= total - 1) return total - 4;
    if (g <= 1) return 0;
    const left = g % 2 === 1 ? g : g - 1;
    return left - 1;
  };

  const locked = () => performance.now() < lockRef.current;
  const lockFor = (ms: number) => {
    lockRef.current = performance.now() + ms;
  };
  const finishBackCoverTransition = () => {
    if (backCoverTransitionTimerRef.current !== null) {
      window.clearTimeout(backCoverTransitionTimerRef.current);
      backCoverTransitionTimerRef.current = null;
    }
    setBackCoverTransition(false);
  };
  const beginBackCoverTransition = () => {
    if (backCoverTransitionTimerRef.current !== null) {
      window.clearTimeout(backCoverTransitionTimerRef.current);
      backCoverTransitionTimerRef.current = null;
    }
    setBackCoverTransition(true);
    if (resizing) {
      requestAnimationFrame(finishBackCoverTransition);
      return;
    }
    backCoverTransitionTimerRef.current = window.setTimeout(
      finishBackCoverTransition,
      FLIP_MS + 100
    );
  };

  const nextPage = () => {
    if (isLastPage) return;
    if (split) {
      if (locked()) return;
      playSound();
      if (currentPage === 0) {
        lockFor(FLIP_MS);
        setLayoutPage(1);
        setCurrentPage(1);
        return;
      }
      if (currentPage >= total - 3) {
        lockFor(FLIP_MS);
        beginBackCoverTransition();
        setLayoutPage(total - 1);
        setCurrentPage(total - 1);
        return;
      }
      setLayoutPage(currentPage + 2);
      lockFor(FLIP_MS);
      getPageFlip()?.flipNext();
      return;
    }
    if (locked()) return;
    playSound();
    lockFor(FLIP_MS);
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
        lockFor(FLIP_MS);
        setLayoutPage(0);
        setCurrentPage(0);
        return;
      }
      if (currentPage >= total - 1) {
        lockFor(FLIP_MS);
        beginBackCoverTransition();
        setLayoutPage(total - 3);
        setCurrentPage(total - 3);
        return;
      }
      setLayoutPage(currentPage - 2);
      getPageFlip()?.flipPrev();
      return;
    }
    if (locked()) return;
    playSound();
    lockFor(FLIP_MS);
    setLayoutPage(
      Math.max(
        0,
        isPortrait ? currentPage - 1 : currentPage <= 1 ? 0 : currentPage - 2
      )
    );
    flipPrev();
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
        forcedRef.current = target;
        pf?.turnToPage?.(fl);
        setIsFlipping(false);
        setLayoutPage(target);
        setCurrentPage(target);
        requestAnimationFrame(() => {
          setBookHidden(false);
        });
        setTimeout(() => {
          forcedRef.current = null;
        }, 400);
      }, 190);
      return;
    }
    if (locked()) return;
    playSound();
    lockFor(FLIP_MS);
    setLayoutPage(spreadOf(g));
    getPageFlip()?.flip(g);
  };
  const goToFirstPage = () => goToPage(0);
  const goToLastPage = () => goToPage(total - 1);

  const handleFlip = (event: { data: number }) => {
    if (resizingBookRef.current) return;
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
    if (resizingBookRef.current) return;
    const pf = getPageFlip();
    if (!pf) return;

    if (e.data === "read") {
      setIsFlipping(false);
      foldSoundRef.current = false;
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
        setCurrentPage(idx);
      }
      return;
    }
    if (e.data === "user_fold") {
      lockFor(FLIP_MS);
      setIsFlipping(true);
      foldSoundRef.current = true;
      playSound();
      return;
    }
    if (e.data !== "flipping") return;
    lockFor(FLIP_MS);
    setIsFlipping(true);
    if (!foldSoundRef.current) playSound();

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
    return <CatalogueGrid pages={pages} />;
  }

  let shiftX = 0;
  if (CENTER_COVERS && !isPortrait) {
    if (layoutFirst) shiftX = -w / 2;
    else if (layoutLast) shiftX = w / 2;
  }

  const isOpenSpread = currentPage > 0 && currentPage < total - 1;

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
  const splitBehind =
    layoutFirst
      ? 0
      : layoutLast
        ? leaves
        : Math.min(leaves, Math.floor((layoutPage - 1) / 2));
  const stackL = isPortrait
    ? backCoverSide
      ? (behind / 2) * leafUnit
      : 0
    : split
      ? splitBehind * leafUnit
      : (behind / 2) * leafUnit;
  const stackR = isPortrait
    ? backCoverSide
      ? 0
      : (ahead / 2) * leafUnit
    : split
      ? (leaves - splitBehind) * leafUnit
      : (ahead / 2) * leafUnit;
  const bindW = Math.max(2, Math.round(BIND_W * k));
  const stackTransition = resizing || layoutFirst || layoutLast
    ? "none"
    : `left ${SHIFT_MS}ms ${SHIFT_EASE}, width ${SHIFT_MS}ms ${SHIFT_EASE}`;

  const flipItems = split
    ? [
        { page: { id: -3, title: "", blank: true } as CataloguePage, g: -1, ghost: true },
        ...bookPages
          .slice(2, total - 1)
          .map((page, i) => ({ page, g: i + 2, ghost: false })),
      ]
    : bookPages.map((page, index) => ({ page, g: index, ghost: false }));

  const leafShell = (
    angle: number,
    over: boolean,
    front: ReactNode,
    back: ReactNode,
    onClick: () => void,
    instant: boolean,
    onTurnEnd?: () => void,
    zIndexDelay = FLIP_MS / 2
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
          : `z-index ${instant ? 0 : 0}s linear ${instant ? 0 : zIndexDelay}ms, opacity ${
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
        onTransitionEnd={(event) => {
          if (
            event.target === event.currentTarget &&
            event.propertyName === "transform"
          ) {
            onTurnEnd?.();
          }
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
      <CatalogueControls
        label={label}
        currentPage={currentPage}
        total={total}
        isFirstPage={isFirstPage}
        isLastPage={isLastPage}
        isPortrait={isPortrait}
        isFullscreen={isFullscreen}
        bookPages={bookPages}
        onToggleFullscreen={toggleFullscreen}
        onFirstPage={goToFirstPage}
        onLastPage={goToLastPage}
        onSelectPage={goToPage}
      >
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
                className={`cb-book-binding ${
                  backCoverSide ? "cb-book-binding--right" : ""
                }`}
                style={{
                  left: backCoverSide
                    ? baseLeft + baseWidth
                    : baseLeft - bindW,
                  width: bindW,
                }}
              />
            ) : null}
            {(!isPortrait || backCoverSide) && (
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
                width: split && layoutLast ? w : undefined,
                opacity: bookHidden ? 0 : 1,
                transition: `opacity ${bookHidden ? 160 : 220}ms ease`,
              }}
            >
              {measured && (
                <HTMLFlipBook
                  key={isPortrait ? "p" : "l"}
                  ref={(instance: any) => {
                    bookRef.current = instance;
                  }}
                  className={`catalogue-book ${
                    backCoverTransition ? "cb-back-cover-transition" : ""
                  }`}
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
                          className="cb-page--ghost relative h-full w-full"
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
                        className={`cb-page relative h-full w-full overflow-hidden ${
                          g === total - 2 ? "cb-back-cover-underlay" : ""
                        }`}
                      >
                        <CataloguePageContent
                          page={page}
                          cover={isCover}
                          left={isLeftPage}
                          hingeBack={!isPortrait && g !== 0}
                          eager={total <= 80 || Math.abs(g - currentPage) < 8}
                        />
                      </div>
                    );
                  })}
                </HTMLFlipBook>
              )}

              {spineHost &&
                !isPortrait &&
                createPortal(
                  <div
                    aria-hidden
                    className="cb-spine transition-opacity"
                    style={{
                      opacity: isOpenSpread || backCoverTransition ? 1 : 0,
                      transitionDuration: isFlipping ? "120ms" : "450ms",
                    }}
                  />,
                  spineHost
                )}
            </div>

            {split && (
              <>
                {leafShell(
                  layoutFirst ? 0 : -180,
                  layoutFirst,
                  <CataloguePageContent
                    page={bookPages[0]}
                    cover={true}
                    left={false}
                    hingeBack={false}
                    eager={true}
                  />,
                  <CataloguePageContent
                    page={bookPages[1]}
                    cover={false}
                    left={true}
                    hingeBack={false}
                    eager={true}
                  />,
                  nextPage,
                  snap.front
                )}
                {leafShell(
                  layoutLast ? -180 : 0,
                  layoutLast || backCoverTransition,
                  <CataloguePageContent
                    page={bookPages[total - 2]}
                    cover={false}
                    left={false}
                    hingeBack={false}
                    eager={true}
                  />,
                  <CataloguePageContent
                    page={bookPages[total - 1]}
                    cover={true}
                    left={false}
                    hingeBack={true}
                    eager={true}
                  />,
                  previousPage,
                  snap.back,
                  backCoverTransition
                    ? finishBackCoverTransition
                    : undefined,
                  0
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

      </CatalogueControls>
    </div>
  );
};

export default CatalogueViewer;