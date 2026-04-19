function App() {
  return (
    <>
      <header>
        <table>
          <tbody>
            <tr>
              <td>
                <a href="/">
                  <img src="/images/AGlogo.PNG" alt="Abstruse Goose" />
                </a>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div id="menu_top"></div>
      </header>

      <section>
        <div id="pages_container">
          <h1 className="storytitle">
            <a href="/about">about</a>
          </h1>
          <p>
            The Abstruse Goose comic is a subsidiary of the powerful and evil
            Abstruse Goose Corporation.
          </p>
        </div>
      </section>

      <footer>
        <nav>
          <a href="/">HOME</a>
          {"         "}
          <a href="/archive">ARCHIVE</a>
          {"         "}
          <a href="/feedthegoose">FEED THE GOOSE</a>
          {"         "}
          <a href="/store">STORE</a>
        </nav>

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
            <a href="/about">about</a>
            {"      "}
            <a href="/faq">faq</a>
            {"      "}
            <a href="/privacy">privacy</a>
          </p>
        </div>
      </footer>
    </>
  );
}

export default App;
