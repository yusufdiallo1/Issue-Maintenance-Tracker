import { Logo } from "./Logo";

/** Full-screen branded loader: the Aurion compass mark spinning. */
export function LoadingScreen() {
  return (
    <div className="loadscreen" role="status" aria-label="Loading">
      <div className="loadspin">
        <Logo variant="mark" />
      </div>
    </div>
  );
}
