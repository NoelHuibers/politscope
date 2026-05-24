import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PartyDot } from "@/components/PartyDot";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[min(720px,92vw)] gap-0 overflow-hidden p-0 sm:max-w-[720px]">
        <DialogHeader className="border-b px-6 pt-5 pb-4">
          {speechQuery.isPending && (
            <DialogTitle className="text-muted-foreground">Lade Rede…</DialogTitle>
          )}
          {speechQuery.isError && (
            <DialogTitle className="text-destructive">Konnte Rede nicht laden.</DialogTitle>
          )}
          {speech && (
            <>
              <DialogTitle
                className="text-2xl font-medium"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {speech.mp ? (
                  <Link
                    to="/$locale/abgeordnete/$id"
                    params={{ locale: "de", id: speech.mp.extId }}
                    className="text-foreground no-underline hover:underline"
                    onClick={() => onOpenChange(false)}
                  >
                    {speech.mp.name}
                  </Link>
                ) : (
                  "Unbekannte Sprecher:in"
                )}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {party && (
                    <span className="inline-flex items-center gap-1.5">
                      <PartyDot id={speech.mp?.party as PartyId} size={9} />
                      <span className="font-semibold" style={{ color: party.colorVar }}>
                        {party.full}
                      </span>
                    </span>
                  )}
                  {speech.mp?.role && <span>· {speech.mp.role}</span>}
                  <span>·</span>
                  <span>{germanLong(speech.sessionDate)}</span>
                  <span>
                    · WP{speech.wahlperiode} Sitzung {speech.sitzung}
                  </span>
                  {speech.top !== null && <span>· TOP {speech.top}</span>}
                  <span>· {speech.wordCount} Wörter</span>
                </div>
              </DialogDescription>
            </>
          )}
        </DialogHeader>
        {speech && (
          <div
            className="scroll-y overflow-y-auto px-6 pt-4 pb-6 text-base whitespace-pre-wrap text-foreground"
            style={{ fontFamily: "var(--font-serif)", lineHeight: 1.6 }}
          >
            {speech.text}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
