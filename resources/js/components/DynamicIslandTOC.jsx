import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Pastikan kamu sudah install framer-motion
import { X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Fungsi penggabung class Tailwind (pengganti @/lib/utils)
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const islandTransition = {
  type: "tween",
  ease: [0.22, 1, 0.36, 1],
  duration: 0.5,
};

function CircleProgress({ percentage }) {
  const size = 24;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#111827" // kas-dark
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DynamicIslandTOC({
  children,
  selector = "article h2, article h3, [data-toc]",
}) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const getHeadings = () => {
      const elements = Array.from(document.querySelectorAll(selector));
      const validHeadings = elements
        .filter((el) => !el.hasAttribute("data-toc-ignore"))
        .map((el, index) => {
          if (!el.id) {
            el.id = el.textContent?.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "") || `toc-heading-${index}`;
          }
          const depthAttr = el.getAttribute("data-toc-depth");
          let level = 2;
          if (depthAttr) {
            level = parseInt(depthAttr, 10);
          } else {
            const tagName = el.tagName.toUpperCase();
            if (tagName.startsWith("H") && tagName.length === 2) {
              level = parseInt(tagName[1], 10);
            }
          }
          const text = el.getAttribute("data-toc-title") || el.textContent || "Section";
          return { id: el.id, text, level, element: el };
        });

      validHeadings.sort((a, b) =>
        a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      );
      setHeadings(validHeadings);
    };

    const timer = setTimeout(getHeadings, 100);
    return () => clearTimeout(timer);
  }, [selector]);

  useEffect(() => {
    const handleScroll = () => {
      let currentActiveId = null;
      for (const heading of headings) {
        const top = heading.element.getBoundingClientRect().top;
        if (top <= 150) {
          currentActiveId = heading.id;
        } else {
          break;
        }
      }
      if (!currentActiveId && headings.length > 0) {
        currentActiveId = headings[0].id;
      }
      setActiveId(currentActiveId);

      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  const activeHeading = headings.find((h) => h.id === activeId);
  const minLevel = useMemo(() => {
    if (headings.length === 0) return 1;
    return Math.min(...headings.map((h) => h.level));
  }, [headings]);

  return (
    <>
      {children}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={islandTransition}
            className="fixed inset-0 z-[98] bg-black/10 backdrop-blur-[2px]"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-[30px] left-1/2 z-[99] flex -translate-x-1/2 flex-col items-center"
      >
        <motion.div
          onClick={() => { if (!isExpanded) setIsExpanded(true); }}
          initial={false}
          animate={{
            width: isExpanded ? 340 : 280,
            height: isExpanded ? 400 : 56,
            borderRadius: isExpanded ? 24 : 28,
          }}
          transition={islandTransition}
          style={{ cursor: isExpanded ? "default" : "pointer" }}
          className="relative overflow-hidden border border-gray-200 bg-white text-kas-dark shadow-2xl"
        >
          {/* CLOSED STATE */}
          <motion.div
            initial={false}
            animate={{ opacity: isExpanded ? 0 : 1, scale: isExpanded ? 0.95 : 1, filter: isExpanded ? "blur(4px)" : "blur(0px)" }}
            transition={{ ...islandTransition, delay: isExpanded ? 0 : 0.1 }}
            className={cn("absolute inset-0 flex items-center gap-4 px-5", isExpanded && "pointer-events-none")}
          >
            <div className="h-2 w-2 shrink-0 rounded-full bg-kas-primary animate-pulse" />
            <div className="relative flex h-full flex-1 items-center overflow-hidden text-left">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={activeId || "empty"}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-kas-dark"
                >
                  {activeHeading?.text || "Pusat Kebijakan"}
                </motion.span>
              </AnimatePresence>
            </div>
            <CircleProgress percentage={progress} />
          </motion.div>

          {/* EXPANDED STATE */}
          <motion.div
            initial={false}
            animate={{ opacity: isExpanded ? 1 : 0, scale: isExpanded ? 1 : 1.05 }}
            transition={{ ...islandTransition, delay: isExpanded ? 0.1 : 0 }}
            className={cn("absolute inset-0 flex flex-col", !isExpanded && "pointer-events-none")}
          >
            <div className="flex shrink-0 items-center justify-between px-6 pb-3 pt-5">
              <span className="text-xs font-black tracking-widest text-gray-400 uppercase">DAFTAR ISI</span>
              <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} className="text-gray-400 hover:text-kas-dark">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              <div className="flex flex-col gap-1">
                {headings.map((h) => {
                  const isActive = activeId === h.id;
                  const isHovered = hoveredId === h.id;
                  const paddingLeft = Math.max(0, h.level - minLevel) * 14 + 12;

                  return (
                    <button
                      key={h.id}
                      onMouseEnter={() => setHoveredId(h.id)} onMouseLeave={() => setHoveredId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        const yOffset = -100;
                        const y = h.element.getBoundingClientRect().top + window.scrollY + yOffset;
                        window.scrollTo({ top: y, behavior: "smooth" });
                        setIsExpanded(false);
                      }}
                      style={{ paddingLeft: `${paddingLeft}px` }}
                      className={cn(
                        "group flex w-full shrink-0 cursor-pointer items-center rounded-xl border-none py-2.5 pr-3 text-left text-sm transition-all duration-300",
                        isActive && "bg-kas-primary/10 font-bold text-kas-primary",
                        !isActive && isHovered && "bg-gray-50 text-kas-dark",
                        !isActive && !isHovered && "bg-transparent text-gray-500 font-medium"
                      )}
                    >
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap transition-transform duration-300 group-hover:translate-x-1">
                        {h.text}
                      </span>
                      <motion.div
                        initial={false} animate={{ scale: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
                        className="ml-3 h-1.5 w-1.5 shrink-0 rounded-full bg-kas-primary"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
}