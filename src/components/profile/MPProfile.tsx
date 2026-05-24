import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { BottomStrip } from "@/components/layout/BottomStrip";
import { LeftRail } from "@/components/layout/LeftRail";
import { TopBar } from "@/components/layout/TopBar";
import { PartyDot } from "@/components/PartyDot";
import { SpeechListItem } from "@/components/SpeechListItem";
import { FingerprintGrid } from "@/components/viz/FingerprintGrid";
import { PARTY, type PartyId } from "@/data/parties";
import {
  getSpeechesByMp,
  type MpPhoto as MpPhotoData,
  type MpProfile as MpProfileData,
} from "@/lib/server/directory";
import { getMpDistinctivePhrases } from "@/lib/server/distinctive";
import { getMpFingerprints } from "@/lib/server/fingerprint";
import { useUI } from "@/state/ui";
import { InsufficientDataFrame } from "./InsufficientDataFrame";
import { ProfileSection } from "./ProfileSection";
import { Stat } from "./Stat";

type Props = {
  realProfile: MpProfileData;
};

function germanLong(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function MpPhoto({ photo, alt }: { photo: MpPhotoData | null; alt: string }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Placeholder silhouette (no photo, or load error).
  if (!photo || errored) {
    return (
      <div
        style={{
          width: 200,
          height: 240,
          background: "linear-gradient(180deg, var(--bg-2), var(--panel))",
          border: "1px solid var(--hairline)",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg viewBox="0 0 100 120" width="120" height="144" aria-hidden="true">
          <circle cx="50" cy="42" r="20" fill="var(--hairline)" />
          <path d="M14 120 C 14 80 86 80 86 120 Z" fill="var(--hairline)" />
        </svg>
        <span
          style={{
            position: "absolute",
            bottom: 6,
            left: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "var(--muted)",
          }}
        >
          Foto: Wikidata, sofern lizenziert
        </span>
      </div>
    );
  }

  const sizedUrl = `${photo.url}?width=400`;

  return (
    <div
      style={{
        width: 200,
        height: 240,
        background: "var(--bg-2)",
        border: "1px solid var(--hairline)",
        borderRadius: 4,
        marginBottom: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <img
        src={sizedUrl}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 25%",
          opacity: loaded ? 1 : 0,
          transition: "opacity 200ms ease-out",
        }}
      />

      <button
        type="button"
        aria-label="Bildquelle anzeigen"
        onClick={() => setPopoverOpen((v) => !v)}
        onMouseEnter={() => setPopoverOpen(true)}
        onMouseLeave={() => setPopoverOpen(false)}
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "rgba(20,18,12,0.55)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.9)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        i
      </button>

      {popoverOpen && (
        <div
          style={{
            position: "absolute",
            bottom: 6,
            left: 6,
            right: 6,
            padding: "7px 9px",
            background: "rgba(20,18,12,0.86)",
            color: "rgba(255,255,255,0.92)",
            borderRadius: 4,
            fontFamily: "var(--font-sans)",
            fontSize: 10.5,
            lineHeight: 1.35,
            backdropFilter: "blur(2px)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {photo.attribution && (
            <span>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>Foto: </span>
              {photo.attribution}
            </span>
          )}
          {photo.license && (
            <span style={{ color: "rgba(255,255,255,0.75)" }}>{photo.license}</span>
          )}
          {photo.attributionUrl && (
            <a
              href={photo.attributionUrl}
              target="_blank"
              rel="noreferrer noopener"
              style={{
                color: "var(--accent)",
                textDecoration: "none",
                marginTop: 2,
              }}
            >
              Quelle auf Commons →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function PartyLabel({ party }: { party: PartyId }) {
  const p = PARTY[party];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <PartyDot id={party} size={10} />
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 12,
          fontWeight: 600,
          color: p.colorVar,
        }}
      >
        {p.full}
      </span>
    </div>
  );
}

export function MPProfile({ realProfile }: Props) {
  const openSpeechInspector = useUI((s) => s.openSpeechInspector);

  const extId = realProfile.extId;
  const speechesQuery = useQuery({
    queryKey: ["speeches-by-mp", extId],
    queryFn: () => getSpeechesByMp({ data: extId }),
  });
  const distinctiveQuery = useQuery({
    queryKey: ["distinctive-phrases", extId],
    queryFn: () => getMpDistinctivePhrases({ data: extId }),
  });
  const fingerprintQuery = useQuery({
    queryKey: ["mp-fingerprint", extId],
    queryFn: () => getMpFingerprints({ data: { topN: 1, extId } }),
  });

  const displayName = realProfile.name;
  const displayParty = realProfile.party as PartyId;
  const displayRole = realProfile.role;
  const displaySince = realProfile.since;
  const displaySpeechCount = realProfile.totalSpeeches;
  const displayFirstSpeech = germanLong(realProfile.firstSpeechDate);
  const displayLastSpeech = germanLong(realProfile.lastSpeechDate);

  // Split on whitespace; surname = last token, everything before = titles + given names.
  // Handles "Friedrich Merz" → ["Friedrich", "Merz"] and
  // "Dr. Dr. Zanda Grundberg" → ["Dr. Dr. Zanda", "Grundberg"].
  const nameParts = displayName.trim().split(/\s+/);
  const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : null;
  const givens = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : displayName;
  const fingerprintMp = fingerprintQuery.data?.mps[0];

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
        overflow: "hidden",
      }}
    >
      <TopBar />
      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
        <LeftRail />
        <div
          className="scroll-y"
          style={{
            flex: 1,
            padding: "26px 32px 18px",
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            gap: 28,
            overflowY: "auto",
            minWidth: 0,
          }}
        >
          {/* Header column */}
          <div>
            <MpPhoto photo={realProfile.photo} alt={displayName} />

            <PartyLabel party={displayParty} />
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 500,
                fontSize: 30,
                margin: "0 0 4px",
                letterSpacing: "-0.012em",
                lineHeight: 1.05,
              }}
            >
              {givens}
              {surname && (
                <>
                  <br />
                  {surname}
                </>
              )}
            </h1>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                color: "var(--ink-2)",
                marginBottom: 10,
              }}
            >
              {displayRole ? `${displayRole} · ` : ""}MdB seit {displaySince ?? "?"}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "12px 14px",
                background: "var(--panel-2)",
                border: "1px solid var(--hairline)",
                borderRadius: 4,
              }}
            >
              <Stat label="Reden gesamt" value={displaySpeechCount.toString()} />
              <Stat label="Erste Rede" value={displayFirstSpeech} />
              <Stat label="Letzte Rede" value={displayLastSpeech} />
            </div>

            <a
              href="https://www.abgeordnetenwatch.de"
              target="_blank"
              rel="noreferrer noopener"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 14,
                fontFamily: "var(--font-sans)",
                fontSize: 11.5,
                color: "var(--accent)",
                textDecoration: "none",
              }}
            >
              <Icon name="chevR" size={11} color="var(--accent)" /> Stimmverhalten auf
              abgeordnetenwatch.de
            </a>
          </div>

          {/* Right column — analytical sections first, raw speech list at the bottom */}
          <div style={{ display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>
            <InsufficientDataFrame
              speechCount={displaySpeechCount}
              threshold={10}
              mpName={displayName}
            />

            {fingerprintQuery.data && fingerprintMp && fingerprintMp.quarters.length >= 2 && (
              <ProfileSection
                title="Sprachprofil"
                eyebrow={`5 Merkmale × ${fingerprintMp.quarters.length} Quartale`}
                hint="Heatmap: pro Quartal Satzlänge, Lexikon, Emotionalität, Formalität und Abweichung von der eigenen Fraktion."
                ki
              >
                <FingerprintGrid width={660} realData={fingerprintQuery.data} columns={1} />
              </ProfileSection>
            )}

            <ProfileSection
              title="Charakteristische Wendungen"
              eyebrow="Log-Odds-Ratio mit Dirichlet-Prior"
              hint={`Wörter, die ${surname ?? displayName} signifikant häufiger nutzt als der Bundestag insgesamt.`}
              ki
            >
              {(() => {
                if (distinctiveQuery.isPending) {
                  return <div style={{ color: "var(--muted)", fontSize: 13 }}>Berechne…</div>;
                }
                const phrases = distinctiveQuery.data ?? [];
                if (phrases.length === 0) {
                  return (
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>
                      Zu wenige Reden für statistische Auswertung.
                    </div>
                  );
                }
                const maxWeight = Math.max(...phrases.map((p) => p.weight));
                return (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {phrases.map((p) => {
                      const scale = 0.9 + (p.weight / maxWeight) * 0.7;
                      return (
                        <span
                          key={p.phrase}
                          title={`Wert: z=${p.weight.toFixed(2)} · ${p.count}× in Reden`}
                          style={{
                            fontFamily: "var(--font-sans)",
                            fontSize: 12 * scale,
                            fontWeight: 500,
                            padding: "4px 10px",
                            border: "1px solid var(--hairline)",
                            borderRadius: 12,
                            background: "var(--bg-2)",
                            color: "var(--ink)",
                          }}
                        >
                          {p.phrase}
                        </span>
                      );
                    })}
                  </div>
                );
              })()}
            </ProfileSection>

            <ProfileSection
              title="Alle Reden"
              eyebrow={`${speechesQuery.data?.length ?? "—"} Reden im Korpus`}
              hint="Chronologisch absteigend. Klick öffnet die vollständige Rede."
            >
              {speechesQuery.isPending && (
                <div style={{ color: "var(--muted)", fontSize: 13, padding: "8px 0" }}>
                  Lade Reden…
                </div>
              )}
              {speechesQuery.data && speechesQuery.data.length === 0 && (
                <div style={{ color: "var(--muted)", fontSize: 13, padding: "8px 0" }}>
                  Keine Reden im Korpus.
                </div>
              )}
              {speechesQuery.data && speechesQuery.data.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {speechesQuery.data.map((s) => (
                    <SpeechListItem
                      key={s.id}
                      speech={s}
                      showSpeaker={false}
                      onSelect={openSpeechInspector}
                    />
                  ))}
                </div>
              )}
            </ProfileSection>
          </div>
        </div>
      </div>
      <BottomStrip />
    </div>
  );
}
