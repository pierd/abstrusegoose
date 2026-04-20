import { Link } from "react-router-dom";
import { numericStripIds, strips } from "../strips";

function Archive() {
  return (
    <div id="pages_container">
      <h1 className="storytitle">
        <Link to="/archive">ARCHIVE</Link>
      </h1>
      <br />
      <ul id="archive">
        {numericStripIds.map((id) => {
          const strip = strips[id];
          return (
            <li key={id}>
              <Link to={`/${id}`}>{strip.title ?? strip.image_alt ?? id}</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Archive;
