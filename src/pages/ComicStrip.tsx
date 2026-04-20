import { Link, useNavigate, useParams } from "react-router-dom";
import { currentId, firstId, Strip, strips, numericStripIds } from "../strips";


function Navigation({ strip }: { strip: Strip }) {
  const navigate = useNavigate();
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
      <a
        style={{ cursor: "pointer" }}
        onClick={async () => {
          // navigate to random strip
          const id =
            numericStripIds[
              Math.floor(Math.random() * numericStripIds.length)
            ];
          await navigate(`/${id}`);
        }}
      >
        Random
      </a>
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

  const strip = strips[id];

  if (!strip) {
    return (
      <div id="pages_container">
        <h1 className="storytitle">Not found</h1>
        <p>No strip with id {id}.</p>
      </div>
    );
  }

  const image = strip.image_url ? (
    <img
      src={strip.image_url}
      alt={strip.image_alt ?? ""}
      width={strip.image_width ?? undefined}
      height={strip.image_height ?? undefined}
      title={strip.image_title ?? undefined}
    />
  ) : null;

  return (
    <div id="pages_container">
      <Navigation strip={strip} />
      <h1 className="storytitle">
        <Link to={`/${id}`}>{strip.title ?? strip.image_alt ?? id}</Link>
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
