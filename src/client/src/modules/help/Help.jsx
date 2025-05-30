import React from "react";
import Header from "../../components/Header.jsx";

export default function HelpPage() {
  return (
    <>
      <Header />

      <main>
        <section className="card" style={{ maxWidth: "850px" }}>
          <h2 style={{ marginTop: 0 }}>Welcome to Web-Player 🎵</h2>

          <p>
            Web-Player is a tiny <strong>React + Express</strong> application
            that lets you browse and play your local&nbsp;MP3 collection from
            any browser.  Just drop your tracks into the Docker image (or mount
            them at runtime) and press&nbsp;play.
          </p>

          <h3>Pages at a glance</h3>
          <ul>
            <li>
              <strong>Library</strong> – navigate the folder tree and click a
              track to play it in the built-in HTML&nbsp;audio&nbsp;player.
            </li>
            <li>
              <strong>Config</strong> – switch the accent palette (blue /
              technical-grey), choose colour-scheme mode, and rename the
              application.
            </li>
            <li>
              <strong>Help</strong> – this page.
            </li>
          </ul>

          <h3>Keyboard shortcuts</h3>
          <table>
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><kbd>L</kbd></td>
                <td>Library</td>
              </tr>
              <tr>
                <td><kbd>C</kbd></td>
                <td>Config</td>
              </tr>
              <tr>
                <td><kbd>H</kbd></td>
                <td>Help</td>
              </tr>
            </tbody>
          </table>

          <h3>FAQ</h3>
          <p>
            <strong>❓ Where are my MP3 files stored?</strong><br />
            By default Web-Player serves everything inside{" "}
            <code>/app/media</code> <em>inside the container.</em> You can
            either copy your music there during the Docker build or mount a host
            folder at runtime with <code>-v /host/music:/app/media</code>.
          </p>

          <p>
            <strong>❓ Can I change the accent colour?</strong><br />
            Yes – open <em>Config</em> and pick the palette you prefer.
          </p>

          <p>
            <strong>Need more help?</strong> Open an issue on GitHub – PRs and
            questions welcome 🙂
          </p>
        </section>
      </main>
    </>
  );
}
