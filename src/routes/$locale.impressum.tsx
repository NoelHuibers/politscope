import { createFileRoute } from "@tanstack/react-router";
import { FillIn, LegalLayout, P, Section } from "@/components/legal/LegalLayout";

export const Route = createFileRoute("/$locale/impressum")({
  component: ImpressumPage,
});

function ImpressumPage() {
  const { locale } = Route.useParams();
  return (
    <LegalLayout title="Impressum" eyebrow="Anbieterkennzeichnung nach § 5 DDG" locale={locale}>
      <Section id="anbieter" title="Anbieter">
        <P>
          <FillIn>VOR- UND NACHNAME</FillIn>
          <br />
          <FillIn>STRASSE UND HAUSNUMMER</FillIn>
          <br />
          <FillIn>PLZ ORT</FillIn>
          <br />
          <FillIn>LAND</FillIn>
        </P>
      </Section>

      <Section id="kontakt" title="Kontakt">
        <P>
          E-Mail: <FillIn>kontakt@beispiel.de</FillIn>
          <br />
          Telefon: <FillIn>+49 …</FillIn>
        </P>
      </Section>

      <Section id="verantwortlich" title="Inhaltlich Verantwortlich (§ 18 Abs. 2 MStV)">
        <P>
          <FillIn>VOR- UND NACHNAME</FillIn>
          <br />
          <FillIn>ANSCHRIFT WIE OBEN</FillIn>
        </P>
      </Section>

      <Section id="streitbeilegung" title="EU-Streitbeilegung">
        <P>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </P>
        <P>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </P>
      </Section>

      <Section id="haftung-inhalte" title="Haftung für Inhalte">
        <P>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
          nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als
          Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
          Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
          Tätigkeit hinweisen.
        </P>
        <P>
          PolitScope verarbeitet ausschließlich offen lizenzierte Plenarprotokolle des Deutschen
          Bundestages (bundestag.de/services/opendata) sowie Foto- und Strukturdaten von Wikidata /
          Wikimedia Commons. Wir geben keine eigenen Aussagen über Abgeordnete ab; alle
          dargestellten Werte sind algorithmisch aus dem öffentlichen Redematerial berechnet.
        </P>
      </Section>

      <Section id="haftung-links" title="Haftung für Links">
        <P>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
          Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
          Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
          Seiten verantwortlich.
        </P>
      </Section>

      <Section id="urheberrecht" title="Urheberrecht">
        <P>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
          dem deutschen Urheberrecht. Quellcode von PolitScope ist quelloffen unter{" "}
          <a
            href="https://github.com/NoelHuibers/politscope"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            github.com/NoelHuibers/politscope
          </a>{" "}
          verfügbar. Reden des Deutschen Bundestages stehen unter der jeweils dort angegebenen
          Open-Data-Lizenz; MdB-Fotos unterliegen den Commons-Lizenzen, die jeweils direkt am Foto
          angezeigt werden.
        </P>
      </Section>
    </LegalLayout>
  );
}
