import { createFileRoute } from "@tanstack/react-router";
import { FillIn, LegalLayout, P, Section } from "@/components/legal/LegalLayout";

export const Route = createFileRoute("/$locale/datenschutz")({
  component: DatenschutzPage,
});

function DatenschutzPage() {
  const { locale } = Route.useParams();
  return (
    <LegalLayout
      title="Datenschutzerklärung"
      eyebrow="DSGVO / BDSG"
      lastUpdated="Stand: noch zu finalisieren"
      locale={locale}
    >
      <Section id="ueberblick" title="1. Datenschutz auf einen Blick">
        <P>
          PolitScope ist eine analytische Darstellung öffentlich verfügbarer Plenarprotokolle des
          Deutschen Bundestages. Wir verarbeiten{" "}
          <strong>so wenig personenbezogene Daten wie möglich</strong>: kein Login, keine Tracker,
          kein Newsletter, kein Werbenetzwerk. Diese Erklärung beschreibt, was bei einem Besuch
          dieser Website technisch unvermeidbar verarbeitet wird und welche Rechte Sie haben.
        </P>
      </Section>

      <Section id="verantwortlich" title="2. Verantwortlicher">
        <P>Verantwortlich im Sinne der DSGVO und sonstiger nationaler Datenschutzgesetze ist:</P>
        <P>
          <FillIn>VOR- UND NACHNAME</FillIn>
          <br />
          <FillIn>STRASSE UND HAUSNUMMER</FillIn>
          <br />
          <FillIn>PLZ ORT, LAND</FillIn>
          <br />
          E-Mail: <FillIn>kontakt@beispiel.de</FillIn>
        </P>
      </Section>

      <Section id="hosting" title="3. Hosting">
        <P>
          Diese Website wird gehostet bei <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133,
          Walnut, CA 91789, USA. Beim Aufruf werden technisch notwendige Verbindungsdaten (z. B.
          IP-Adresse, User-Agent, Zeitstempel, aufgerufene URL) verarbeitet, um die Auslieferung der
          Seite zu ermöglichen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
          Interesse an einer technisch fehlerfreien Bereitstellung).
        </P>
        <P>
          Da Vercel auch Server in den USA betreibt, kann eine Übermittlung in ein Drittland nach
          Art. 44 ff. DSGVO erfolgen. Vercel verwendet die EU-Standardvertragsklauseln; weitere
          Informationen unter{" "}
          <a
            href="https://vercel.com/legal/dpa"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            vercel.com/legal/dpa
          </a>
          .
        </P>
      </Section>

      <Section id="datenbank" title="4. Datenbank (Neon)">
        <P>
          Die analysierten Bundestagsreden, daraus berechnete Kennzahlen und MdB-Metadaten werden in
          einer PostgreSQL-Datenbank bei <strong>Neon Inc.</strong> (USA) gespeichert. Beim Abrufen
          einer Seite stellt der Server eine Verbindung zur Datenbank her; dabei wird Ihre
          IP-Adresse nicht an Neon übermittelt. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
        </P>
      </Section>

      <Section
        id="externe-dienste"
        title="5. Externe Dienste in der Datenverarbeitung (nicht im Webseitenbetrieb)"
      >
        <P>
          Im Hintergrund — also <em>nicht</em> bei Ihrem Besuch — verwenden wir folgende Dienste, um
          die in PolitScope dargestellten Analysen zu berechnen:
        </P>
        <P>
          <strong>OpenAI</strong> (text-embedding-3-small) zur einmaligen Berechnung semantischer
          Vektoren je Rede. Die Reden sind öffentliche Texte; personenbezogene Daten der Besucher
          werden hierbei nicht verarbeitet.
        </P>
        <P>
          <strong>Wikidata / Wikimedia Commons</strong> für MdB-Fotos und Strukturdaten. Beim
          Anzeigen einer MP-Profilseite wird das Foto direkt von{" "}
          <code style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
            commons.wikimedia.org
          </code>{" "}
          geladen. Dabei erhält Wikimedia technisch notwendige Verbindungsdaten (insb. IP-Adresse).
          Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
        </P>
      </Section>

      <Section id="cookies" title="6. Cookies, lokaler Speicher">
        <P>
          PolitScope setzt <strong>keine Tracking-Cookies</strong> und nutzt kein Web-Analyse-Tool.
          Folgende technisch notwendige Speicherorte werden lokal in Ihrem Browser verwendet:
        </P>
        <P>
          <strong>localStorage</strong> für Ihre Theme-Präferenz (hell/dunkel) und ggf. UI-State wie
          ausgeklappte LeftRail. Diese Daten verlassen Ihr Gerät nicht.
        </P>
        <P>
          <strong>URL-Query-Parameter</strong> spiegeln Filter- und Suchzustand wieder, damit Sie
          Ansichten teilen können. Keine personenbezogene Verarbeitung.
        </P>
      </Section>

      <Section id="logs" title="7. Server-Logs">
        <P>
          Die Vercel-Plattform erstellt automatisch Server-Logs (HTTP-Statuscode, Zeitstempel,
          User-Agent, anonymisierte IP). Diese Daten dienen ausschließlich dem stabilen Betrieb, der
          Sicherheit und der Fehlerdiagnose; sie werden nicht mit anderen Quellen zusammengeführt
          und nach <FillIn>30 TAGE</FillIn> automatisch gelöscht. Rechtsgrundlage: Art. 6 Abs. 1
          lit. f DSGVO.
        </P>
      </Section>

      <Section id="rechte" title="8. Ihre Rechte als betroffene Person">
        <P>
          Sie haben gegenüber dem Verantwortlichen die folgenden Rechte hinsichtlich der Sie
          betreffenden personenbezogenen Daten:
        </P>
        <P>
          • Recht auf Auskunft (Art. 15 DSGVO)
          <br />• Recht auf Berichtigung (Art. 16 DSGVO)
          <br />• Recht auf Löschung (Art. 17 DSGVO)
          <br />• Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)
          <br />• Recht auf Datenübertragbarkeit (Art. 20 DSGVO)
          <br />• Widerspruchsrecht gegen die Verarbeitung (Art. 21 DSGVO)
          <br />• Recht auf Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3 DSGVO)
        </P>
        <P>
          Zur Geltendmachung dieser Rechte genügt eine formlose E-Mail an die unter Abschnitt 2
          angegebene Adresse.
        </P>
      </Section>

      <Section id="beschwerde" title="9. Beschwerderecht bei der Aufsichtsbehörde">
        <P>
          Sie haben das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde, insbesondere in
          dem Mitgliedstaat Ihres Aufenthaltsorts. Zuständig für den Sitz des Verantwortlichen ist{" "}
          <FillIn>AUFSICHTSBEHÖRDE DES BUNDESLANDES</FillIn>.
        </P>
      </Section>

      <Section id="aktualisierung" title="10. Aktualität dieser Erklärung">
        <P>
          Wir behalten uns vor, diese Datenschutzerklärung anzupassen, sofern die Rechtslage oder
          die Datenverarbeitung sich ändert. Die jeweils aktuelle Fassung ist unter{" "}
          <code style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>/datenschutz</code>{" "}
          abrufbar.
        </P>
      </Section>
    </LegalLayout>
  );
}
