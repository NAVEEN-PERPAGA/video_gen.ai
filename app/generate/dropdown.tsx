"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CheckIcon } from "@/app/generate/icons";
import { useDismiss } from "@/lib/use-dismiss";

export interface DropdownOption {
  value: string;
  label: string;
  group?: string;
  description?: string;
  disabled?: boolean;
}

const GAP = 6;
const EDGE = 8;
const MAX_HEIGHT = 320;

/**
 * Where the menu sits while it's measured: fixed and hidden, so its width fits
 * its content. Left in normal flow it would stretch to the width of <body>
 * (a flex column) and then be clamped against the left edge.
 */
const MEASURING: CSSProperties = { position: "fixed", top: 0, left: 0, visibility: "hidden" };

/**
 * Themed replacement for <select>: native select menus are drawn by the OS,
 * so their colours and scrollbars can't be styled. The menu is portaled to
 * <body> with fixed positioning so scrolling panels can't clip it, and opens
 * above or below the trigger, whichever has more room.
 */
export function Dropdown({
  value,
  options,
  onChange,
  label,
  className,
  menuClassName = "",
  disabled,
  children,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  /** Accessible name for the trigger and menu. */
  label: string;
  className: string;
  menuClassName?: string;
  disabled?: boolean;
  /** Trigger content for the current option. */
  children: (current: DropdownOption | undefined) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [style, setStyle] = useState<CSSProperties>(MEASURING);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const current = options.find((o) => o.value === value);
  const close = useCallback(() => setOpen(false), []);
  useDismiss([triggerRef, menuRef], open, close);

  function openMenu() {
    if (disabled) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setStyle(MEASURING);
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  // Place the menu next to the trigger; re-place on resize and on scroll.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      const rect = trigger.getBoundingClientRect();
      const above = rect.top - GAP - EDGE;
      const below = window.innerHeight - rect.bottom - GAP - EDGE;
      const placeAbove = above > below && menu.scrollHeight > below;
      const width = Math.max(menu.offsetWidth, rect.width);
      setStyle({
        position: "fixed",
        left: Math.min(Math.max(rect.left, EDGE), window.innerWidth - width - EDGE),
        minWidth: rect.width,
        maxHeight: Math.min(MAX_HEIGHT, placeAbove ? above : below),
        ...(placeAbove ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
      });
    };
    place();
    menuRef.current?.focus({ preventScroll: true });
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  // Keep the highlighted option visible while moving with the keyboard.
  useLayoutEffect(() => {
    if (open && active >= 0) {
      menuRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
    }
  }, [open, active]);

  function move(from: number, step: 1 | -1) {
    for (let i = from + step; i >= 0 && i < options.length; i += step) {
      if (!options[i].disabled) return setActive(i);
    }
  }

  function onMenuKeyDown(e: KeyboardEvent) {
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(active, 1),
      ArrowUp: () => move(active, -1),
      Home: () => move(-1, 1),
      End: () => move(options.length, -1),
      Enter: () => choose(active),
      " ": () => choose(active),
      Tab: () => setOpen(false),
      Escape: () => {
        setOpen(false);
        triggerRef.current?.focus();
      },
    };
    const action = keys[e.key];
    if (!action) return;
    if (e.key !== "Tab") e.preventDefault();
    action();
  }

  const groups = [...new Set(options.map((o) => o.group))];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={label}
        title={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openMenu();
          }
        }}
        className={className}
      >
        {children(current)}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={`${id}-menu`}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
            onKeyDown={onMenuKeyDown}
            style={style}
            className={`scroll-inset z-50 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-2xl border border-black/10 bg-background/95 p-1.5 text-sm text-foreground shadow-2xl outline-none backdrop-blur-xl dark:border-white/10 ${menuClassName}`}
          >
            {groups.map((group) => (
              <div key={group ?? ""} role={group ? "group" : undefined} aria-label={group}>
                {group && (
                  <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
                    {group}
                  </div>
                )}
                {options.map((o, index) =>
                  o.group !== group ? null : (
                    <div
                      key={o.value}
                      id={`${id}-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={o.value === value}
                      aria-disabled={o.disabled}
                      onPointerEnter={() => !o.disabled && setActive(index)}
                      onClick={() => choose(index)}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 whitespace-nowrap select-none ${
                        o.disabled ? "cursor-not-allowed opacity-40" : ""
                      } ${index === active ? "bg-black/[0.05] dark:bg-white/[0.08]" : ""} ${
                        o.value === value ? "font-medium text-violet-700 dark:text-violet-300" : ""
                      }`}
                    >
                      <span className="flex-1">
                        {o.label}
                        {o.description && (
                          <span className="block text-[11px] font-normal text-zinc-500">{o.description}</span>
                        )}
                      </span>
                      <CheckIcon className={`size-4 shrink-0 ${o.value === value ? "" : "invisible"}`} />
                    </div>
                  ),
                )}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
