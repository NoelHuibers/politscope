import { Link } from "@tanstack/react-router";
import { PartyDot } from "@/components/PartyDot";
import { PARTY, type PartyId } from "@/data/parties";
import type { SpeechListRow } from "@/lib/server/directory";

type Props = {
  speech: SpeechListRow;
  /** Show the speaker name and party. False on MP profile (speaker is always the page-owner). */
  showSpeaker?: boolean;
  /** Show the session metadata (date + WP/sitzung). False on session detail. */
  showSession?: boolean;
  onSelect: (id: string) => void;
};

function germanShortDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function SpeechListItem({
  speech,
  showSpeaker = true,
  showSession = true,
  onSelect,
}: Props) {
  const party = speech.mp?.party ? PARTY[speech.mp.party as PartyId] : null;
  return (
    <button
      type="button"
      onClick={() => onSelect(speech.id)}
      className="flex w-full flex-col items-start gap-1.5 rounded-md border border-hairline bg-transparent p-3 text-left transition hover:bg-muted/30"
      style={{
        fontFamily: "var(--font-sans)",
        color: "var(--ink)",
        borderColor: "var(--hairline)",
        cursor: "pointer",
      }}
    >
      <div
        className="flex w-full flex-wrap items-center gap-2 text-xs"
        style={{ color: "var(--ink-2)" }}
      >
        {speech.top !== null && (
          <span
            className="rounded px-1.5 py-0.5 font-mono"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--hairline)",
              color: "var(--ink-2)",
              fontSize: 10.5,
            }}
          >
            TOP {speech.top}
          </span>
        )}
        {showSpeaker && speech.mp && (
          <Link
            to="/$locale/abgeordnete/$id"
            params={{ locale: "de", id: speech.mp.extId }}
            className="flex items-center gap-1.5 font-semibold hover:underline"
            style={{ color: "var(--ink)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {party && <PartyDot id={speech.mp.party as PartyId} size={8} />}
            {speech.mp.name}
          </Link>
        )}
        {showSpeaker && !speech.mp && (
          <span style={{ color: "var(--muted)" }}>Unbekannte Sprecher:in</span>
        )}
        {party && showSpeaker && (
          <span style={{ color: party.textColorVar, fontSize: 11 }}>{party.name}</span>
        )}
        {showSession && (
          <span style={{ color: "var(--muted)", marginLeft: "auto", fontSize: 11 }}>
            {germanShortDate(speech.sessionDate)} · WP{speech.wahlperiode} S{speech.sitzung}
          </span>
        )}
        {!showSession && (
          <span style={{ color: "var(--muted)", marginLeft: "auto", fontSize: 11 }}>
            {speech.wordCount} Wörter
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 13.5,
          lineHeight: 1.45,
          color: "var(--ink)",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {speech.preview.trim()}
        {speech.preview.length >= 160 && "…"}
      </div>
    </button>
  );
}
