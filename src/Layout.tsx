import { Link, Outlet } from "react-router-dom";

function Layout() {
  return (
    <>
      <header>
        <table>
          <tbody>
            <tr>
              <td>
                <Link to="/">
                  <img src="/images/AGlogo.PNG" alt="Abstruse Goose" />
                </Link>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div id="menu_top"></div>
      </header>

      <section>
        <Outlet />
      </section>

      <footer>
        <nav>
          <Link to="/">HOME</Link>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <Link to="/archive">ARCHIVE</Link>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <Link to="/feedthegoose">FEED THE GOOSE</Link>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <a href="/store">STORE</a>
        </nav>

        <div id="melikes">
          <p>
            <b>melikes</b>
          </p>
          <a href="http://brownsharpie.courtneygibbons.org">Brown Sharpie</a>
          &nbsp;&nbsp;
          <a href="http://www.explosm.net/comics/new">Cy&H</a>&nbsp;&nbsp;
          <a href="http://www.exocomics.com">EXTRAORDINARY</a>&nbsp;&nbsp;
          <a href="http://pbfcomics.com">PBF</a>&nbsp;&nbsp;
          <a href="http://popstrip.com">popstrip</a>&nbsp;&nbsp;
          <a href="http://spikedmath.com">spiked math</a>&nbsp;&nbsp;
          <a href="http://www.xkcd.com">xkcd</a>
        </div>

        <div className="creativecommons">
          <a
            rel="license"
            href="http://creativecommons.org/licenses/by-nc/3.0/us/"
          >
            <img
              alt="Creative Commons License"
              style={{ borderWidth: 0 }}
              src="http://creativecommons.org/images/public/somerights20.png"
            />
          </a>
          &nbsp;
          <img src="/images/designation.PNG" alt="" />
          <br />
          This work is licensed under a{" "}
          <a
            rel="license"
            href="http://creativecommons.org/licenses/by-nc/3.0/us/"
          >
            Creative Commons Attribution-Noncommercial 3.0 United States License
          </a>
          .
        </div>

        <div className="credit">
          <p>
            <br />A webcomic......... that is all.
          </p>
        </div>

        <div className="privacy">
          <p>
            <Link to="/about">about</Link>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <Link to="/faq">faq</Link>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <a href="/privacy">privacy</a>
          </p>
        </div>
      </footer>
    </>
  );
}

export default Layout;
