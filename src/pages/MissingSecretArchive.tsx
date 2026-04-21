import { Link } from "react-router-dom";

function MissingSecretArchive() {
  return (
    <div id="pages_container">
      <title>Abstruse Goose | Missing page</title>
      <h1 className="storytitle">Missing page</h1>
      <p>
        This page could not be recovered from any web archive.
      </p>
      <p>
        If you have a saved copy of this page, please{" "}
        <a
          href="https://github.com/pierd/abstrusegoose/issues/1"
          target="_blank"
          rel="noreferrer"
        >
          let us know
        </a>
        .
      </p>
      <p>
        <Link to="/110">Back to strip #110 (Disclosure)</Link>
      </p>
    </div>
  );
}

export default MissingSecretArchive;
