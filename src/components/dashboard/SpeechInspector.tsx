import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PartyDot } from "@/components/PartyDot";
import { PARTY, type PartyId } from "@/data/parties";
import { getSpeechById } from "@/lib/server/speech";

type Props = {
  speechId: string | null;
  onOpenChange: (open: boolean) => void;
};

function germanLong(iso: string | null | undefined): string {
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

export function SpeechInspector({ speechId, onOpenChange }: Props) {
  const speechQuery = useQuery({
    queryKey: ["speech", speechId],
    queryFn: () => {
      if (!speechId) throw new Error("no speech id");
      return getSpeechById({ data: speechId });
    },
    enabled: speechId !== null,
  });

  const open = speechId !== null;
  const speech = speechQuery.data;
  const party = speech?.mp?.party ? PARTY[speech.mp.party as PartyId] : null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 50,
          }}
        />
        <Dialog.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(720px, 92vw)",
            maxHeight: "85vh",
            background: "var(--panel)",
            border: "1px solid var(--hairline)",
            borderRadius: 8,
            boxShadow: "var(--shadow-lg, 0 20px 60px rgba(0,0,0,0.35))",
            padding: 0,
            zIndex: 51,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 24px 14px",
              borderBottom: "1px solid var(--hairline)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {speechQuery.isPending && (
                <div style={{ color: "var(--muted)", fontFamily: "var(--font-sans)" }}>
                  Lade Rede…
                </div>
              )}
              {speechQuery.isError && (
                <div style={{ color: "var(--accent)", fontFamily: "var(--font-sans)" }}>
                  Konnte Rede nicht laden.
                </div>
              )}
              {speech && (
                <>
                  <Dialog.Title asChild>
                    <h2
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontWeight: 500,
                        fontSize: 24,
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
                      {speech.mp ? (
                        <Link
                          to="/$locale/abgeordnete/$id"
                          params={{ locale: "de", id: speech.mp.extId }}
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          {speech.mp.name}
                        </Link>
                      ) : (
                        "Unbekannte Sprecher:in"
                      )}
                    </h2>
                  </Dialog.Title>
                  <Dialog.Description asChild>
                    <div
                      style={{
                        marginTop: 6,
                        fontFamily: "var(--font-sans)",
                        fontSize: 12.5,
                        color: "var(--ink-2)",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      {party && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <PartyDot id={speech.mp?.party as PartyId} size={9} />
                          <span style={{ color: party.colorVar, fontWeight: 600 }}>
                            {party.full}
                          </span>
                        </span>
                      )}
                      {speech.mp?.role && (
                        <span style={{ color: "var(--muted)" }}>· {speech.mp.role}</span>
                      )}
                      <span style={{ color: "var(--muted)" }}>·</span>
                      <span>{germanLong(speech.sessionDate)}</span>
                      <span style={{ color: "var(--muted)" }}>
                        · WP{speech.wahlperiode} Sitzung {speech.sitzung}
                      </span>
                      {speech.top !== null && (
                        <span style={{ color: "var(--muted)" }}>· TOP {speech.top}</span>
                      )}
                      <span style={{ color: "var(--muted)" }}>· {speech.wordCount} Wörter</span>
                    </div>
                  </Dialog.Description>
                </>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Schließen"
                style={{
                  background: "transparent",
                  border: "1px solid var(--hairline)",
                  borderRadius: 4,
                  width: 28,
                  height: 28,
                  cursor: "pointer",
                  color: "var(--ink-2)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </Dialog.Close>
          </div>

          {speech && (
            <div
              className="scroll-y"
              style={{
                padding: "18px 24px 24px",
                overflowY: "auto",
                fontFamily: "var(--font-serif)",
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--ink)",
                whiteSpace: "pre-wrap",
              }}
            >
              {speech.text}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
