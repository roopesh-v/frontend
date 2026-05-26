export default function Spinner({ size = "md", light = false, className = "" }) {
  const classes = [
    "spinner",
    `spinner--${size}`,
    light ? "spinner--light" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes} aria-hidden="true" />;
}
