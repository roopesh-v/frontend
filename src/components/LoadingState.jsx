import Spinner from "./Spinner";

export default function LoadingState({
  title = "Loading…",
  hint,
  size = "md",
  className = "",
}) {
  return (
    <div className={`loadingState stateBox ${className}`.trim()} role="status">
      <Spinner size={size} />
      <div>
        <div className="stateTitle">{title}</div>
        {hint && <div className="stateHint">{hint}</div>}
      </div>
    </div>
  );
}
