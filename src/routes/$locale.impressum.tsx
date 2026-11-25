import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, P, Section } from "@/components/legal/LegalLayout";

export const Route = createFileRoute("/$locale/impressum")({
  component: ImpressumPage,
});

function ImpressumPage() {
  const { locale } = Route.useParams();
  return (
    <LegalLayout title="Impressum" eyebrow="Anbieterkennzeichnung nach § 5 DDG" locale={locale}>
      <Section id="anbieter" title="Anbieter">
        <P>
          Noel Huibers
          <br />
          c/o Impressumservice Dein-Impressum
          <br />
          Stettiner Str. 41
          <br />
          35410 Hungen
          <br />
          Deutschland
        </P>
      </Section>

      <Section id="kontakt" title="Kontakt">
        <P>
          E-Mail:{" "}
          <a
            href="mailto:politscope@huibers.io"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            politscope@huibers.io
          </a>
          <br />
          Telefon:{" "}
          <a href="tel:+4915792341658" style={{ color: "var(--accent)", textDecoration: "none" }}>
            {locale === "en" ? "+49 157 9234 1658" : "0157 9234 1658"}
          </a>
        </P>
      </Section>

      <Section id="verantwortlich" title="Inhaltlich verantwortlich nach § 18 Abs. 2 MStV">
        <P>Noel Huibers, Anschrift wie oben</P>
      </Section>

      <Section id="streitbeilegung" title="Verbraucherstreitbeilegung">
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
