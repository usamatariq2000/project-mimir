/* Signature element: machined part-number plate. Used to label every section
   like a component on an instrument chassis. */
export default function EngraveLabel({
  text,
  dark = false,
}: {
  text: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="screw" aria-hidden />
      <span className={dark ? "engrave-dark" : "engrave"}>{text}</span>
      <span
        aria-hidden
        className={`h-px flex-1 max-w-24 ${dark ? "bg-white/15" : "bg-hairline"}`}
      />
    </div>
  );
}
