import { Link, useParams } from "react-router-dom";
import { currentId, firstId, getStrip, type Strip } from "../strips";


function Navigation({ strip }: { strip: Strip }) {
  return (
    <p>
      {strip.previous_id !== null ? (
        <Link to={`/${firstId}`}>&laquo;&laquo; First</Link>
      ) : (
        <>&laquo;&laquo; First</>
      )}
      &nbsp;&nbsp;&nbsp;&nbsp;
      {strip.previous_id !== null ? (
        <Link to={`/${strip.previous_id}`}>&laquo; Previous</Link>
      ) : (
        <>&laquo; Previous</>
      )}
      &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
      <Link to="/random">Random</Link>
      &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
      {strip.next_id !== null ? (
        <Link to={`/${strip.next_id}`}>Next &raquo;</Link>
      ) : (
        <>Next &raquo;</>
      )}
      &nbsp;&nbsp;&nbsp;&nbsp;
      <Link to="/">Current &raquo;&raquo;</Link>
    </p>
  );
}

function ComicStrip() {
  const params = useParams();
  const splat = params["*"];
  const id = splat && splat.length > 0 ? splat : currentId;

  const strip = getStrip(id);

  if (!strip) {
    return (
      <div id="pages_container">
        <title>Abstruse Goose | Not found</title>
        <h1 className="storytitle">Not found</h1>
        <p>No strip with id {id}.</p>
      </div>
    );
  }

  const stripTitle = strip.title ?? strip.image_alt ?? id;

  const image = strip.image_url ? (
    <img
      src={strip.image_url}
      alt={strip.image_alt ?? ""}
      width={strip.image_width ?? undefined}
      height={strip.image_height ?? undefined}
      title={strip.image_title ?? undefined}
    />
  ) : strip.iframe_url && !navigator.onLine ? (
    // Games / interactive comics aren't part of the offline download.
    <p>
      <em>This strip is interactive and isn&rsquo;t available offline.</em>
    </p>
  ) : strip.iframe_url ? (
    <iframe
      src={strip.iframe_url}
      width={strip.iframe_width ?? undefined}
      height={strip.iframe_height ?? undefined}
      title={stripTitle}
      scrolling="no"
      style={{ border: 0 }}
    />
  ) : null;

  return (
    <div id="pages_container">
      <title>Abstruse Goose | {stripTitle}</title>
      <Navigation strip={strip} />
      <h1 className="storytitle">
        <Link to={`/${id}`}>{stripTitle}</Link>
      </h1>
      <br />
      {strip.image_anchor ? (
        <a href={strip.image_anchor}>{image}</a>
      ) : (
        image
      )}
      <div
        id="blog_text"
        dangerouslySetInnerHTML={{ __html: strip.blog_text }}
      />
      <Navigation strip={strip} />
    </div>
  );
}

export default ComicStrip;
