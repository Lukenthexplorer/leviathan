import type { ReactNode } from "react";
import { audio } from "../audio/audio";
import { useHoverLift } from "../feel/useHoverLift";

export function DeskButton(props: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger" | "ghost";
  title?: string;
}) {
  const [ref, hover] = useHoverLift<HTMLButtonElement>(!props.disabled);
  return (
    <button
      ref={ref}
      {...hover}
      title={props.title}
      className={`desk-btn ${props.variant ?? "default"}`}
      disabled={props.disabled}
      onClick={() => {
        audio.sfx("ui_click");
        props.onClick();
      }}
    >
      {props.children}
    </button>
  );
}
