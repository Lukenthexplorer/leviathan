import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { useHoverLift } from "../feel/useHoverLift";

/**
 * Something lying on the desk that does something: the rolodex, the radio, the
 * books... It is a real button (keyboard and screen readers get its name and
 * what it's for). On hover or focus it lifts a little, catches the lamp's light,
 * and a paper tag shows its name and a short description.
 *
 * Position and size come from the `place` class in styles.css, in desk
 * centimetres (--cm), so everything stays in proportion to the A4 sheet.
 */
export const DeskObject = forwardRef<
  HTMLButtonElement,
  { place: string; label: string; hint: string; img: string; onClick: () => void; className?: string; style?: CSSProperties; children?: ReactNode }
>(function DeskObject(props, outer) {
  const [ref, hover] = useHoverLift<HTMLButtonElement>();
  return (
    <button
      ref={(el) => {
        ref.current = el;
        if (typeof outer === "function") outer(el);
        else if (outer) outer.current = el;
      }}
      {...hover}
      onFocus={hover.onMouseEnter}
      onBlur={hover.onMouseLeave}
      className={`desk-object ${props.place} ${props.className ?? ""}`}
      style={props.style}
      onClick={props.onClick}
      aria-label={`${props.label}: ${props.hint}`}
    >
      <img src={props.img} alt="" draggable={false} />
      {props.children}
      <span className="object-tag" aria-hidden>
        <strong>{props.label}</strong>
        <small>{props.hint}</small>
      </span>
    </button>
  );
});
