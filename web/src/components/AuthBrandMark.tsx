/** Shared LifePath mark for auth screens (matches guest landing). */
export default function AuthBrandMark() {
  return (
    <div
      className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary"
      aria-hidden
    >
      <span className="h-3.5 w-3.5 rounded-full bg-white" />
    </div>
  );
}
