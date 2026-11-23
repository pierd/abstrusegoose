import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  downloadForOffline,
  formatBytes,
  getOfflineStatus,
  offlineSupported,
  removeOfflineContent,
  type OfflineStatus,
} from "../offline";

type Phase = "idle" | "downloading" | "error";

function Offline() {
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [failed, setFailed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!offlineSupported) return;
    getOfflineStatus()
      .then(setStatus)
      .catch((e) => setError(String(e)));
    return () => abortRef.current?.abort();
  }, []);

  const download = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("downloading");
    setFailed(0);
    setError(null);
    try {
      await downloadForOffline((s, f) => {
        setStatus(s);
        setFailed(f);
      }, controller.signal);
      setPhase("idle");
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(e instanceof Error ? e.message : String(e));
        setPhase("error");
      }
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setPhase("idle");
  };

  const remove = async () => {
    if (!window.confirm("Remove the downloaded comics from this device?")) return;
    await removeOfflineContent();
    setStatus(await getOfflineStatus());
  };

  const complete = status !== null && status.cachedFiles === status.totalFiles;
  const percent =
    status && status.totalBytes > 0
      ? Math.floor((100 * status.cachedBytes) / status.totalBytes)
      : 0;

  return (
    <div id="pages_container">
      <title>Abstruse Goose | offline reading</title>
      <h1 className="storytitle">
        <Link to="/offline">offline reading</Link>
      </h1>
      <br />
      {!offlineSupported ? (
        <p>This browser doesn't support offline reading.</p>
      ) : (
        <>
          <p>
            Download all the comics to this device so you can read them without
            an internet connection (on a plane, say). Install the site as an
            app first (&ldquo;Add to Home Screen&rdquo; / &ldquo;Install
            app&rdquo;) so the download is kept. Games, videos and semantic
            search aren&rsquo;t available offline.
          </p>
          {status === null ? (
            <p>{error ? `Couldn't check offline content: ${error}` : "Checking..."}</p>
          ) : (
            <>
              <p>
                {complete ? "All comics are downloaded" : "Downloaded"}:{" "}
                {status.cachedFiles} / {status.totalFiles} files,{" "}
                {formatBytes(status.cachedBytes)} / {formatBytes(status.totalBytes)}
                {phase === "downloading" && ` (${percent}%)`}
                {failed > 0 && `, ${failed} failed`}
              </p>
              {phase === "downloading" && (
                <progress
                  className="offline-progress"
                  max={status.totalBytes}
                  value={status.cachedBytes}
                />
              )}
              <p className="offline-actions">
                {phase === "downloading" ? (
                  <button onClick={stop}>Stop</button>
                ) : (
                  !complete && (
                    <button onClick={download}>
                      {status.cachedFiles > 0 ? "Download the rest" : "Download for offline reading"}
                    </button>
                  )
                )}
                {phase !== "downloading" && status.cachedFiles > 0 && (
                  <button onClick={remove}>Remove downloaded comics</button>
                )}
              </p>
              {phase === "error" && error && <p>Download failed: {error}</p>}
              {phase === "idle" && failed > 0 && (
                <p>Some files failed to download; press the button again to retry them.</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Offline;
