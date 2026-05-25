import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PartyDot } from "@/components/PartyDot";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { PARTY, type PartyId } from "@/data/parties";
import { searchSpeeches } from "@/lib/server/search";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSpeech: (speechId: string) => void;
};

type Token = { text: string; mark: boolean };

function tokeniseSnippet(snippet: string): Token[] {
  const tokens: Token[] = [];
  const regex = /<mark>([\s\S]*?)<\/mark>/g;
  let lastIndex = 0;
  for (const match of snippet.matchAll(regex)) {
    const idx = match.index;
    if (typeof idx !== "number") continue;
    if (idx > lastIndex) tokens.push({ text: snippet.slice(lastIndex, idx), mark: false });
    if (match[1]) tokens.push({ text: match[1], mark: true });
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < snippet.length) tokens.push({ text: snippet.slice(lastIndex), mark: false });
  return tokens;
}

function shortDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function SearchPalette({ open, onOpenChange, onSelectSpeech }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  const search = useQuery({
    queryKey: ["search-speeches", debouncedQuery],
    queryFn: () => searchSpeeches({ data: { q: debouncedQuery, limit: 12 } }),
    enabled: debouncedQuery.length >= 2,
  });

  const hits = search.data ?? [];

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reden suchen"
      description="Volltextsuche über alle Bundestagsreden"
      shouldFilter={false}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Reden im Bundestag durchsuchen — z. B. Klimaschutz, Migration, Energie..."
      />
      <CommandList>
        {debouncedQuery.length < 2 && (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            Mindestens 2 Zeichen eingeben — Volltextsuche mit deutscher Stemming-Unterstützung.
          </div>
        )}
        {debouncedQuery.length >= 2 && search.isPending && (
          <div className="px-4 py-6 text-sm text-muted-foreground">Suche läuft…</div>
        )}
        {debouncedQuery.length >= 2 && !search.isPending && hits.length === 0 && (
          <CommandEmpty>Keine Reden gefunden zu „{debouncedQuery}".</CommandEmpty>
        )}
        {hits.map((hit) => {
          const party = hit.mp ? PARTY[hit.mp.party as PartyId] : null;
          const tokens = tokeniseSnippet(hit.snippet);
          return (
            <CommandItem
              key={hit.speechId}
              value={`${hit.speechId} ${hit.mp?.name ?? ""} ${hit.snippet}`}
              onSelect={() => onSelectSpeech(hit.speechId)}
              className="flex-col items-start gap-1 py-3"
            >
              <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
                {hit.mp ? (
                  <>
                    {party && <PartyDot id={hit.mp.party as PartyId} size={8} />}
                    <span className="font-semibold text-foreground">{hit.mp.name}</span>
                    {party && (
                      <span style={{ color: party.textColorVar }} className="text-[11px]">
                        {party.name}
                      </span>
                    )}
                  </>
                ) : (
                  <span>Unbekannte Sprecher:in</span>
                )}
                <span className="ml-auto text-[11px]">
                  {shortDate(hit.sessionDate)} · WP{hit.wahlperiode} S{hit.sitzung}
                </span>
              </div>
              <div
                className="font-serif text-sm leading-snug text-foreground"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {tokens.map((token, i) =>
                  token.mark ? (
                    <mark
                      // biome-ignore lint/suspicious/noArrayIndexKey: stable parse order
                      key={i}
                      className="rounded-sm px-0.5"
                      style={{ background: "var(--accent)", color: "var(--bg)" }}
                    >
                      {token.text}
                    </mark>
                  ) : (
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable parse order
                    <span key={i}>{token.text}</span>
                  ),
                )}
              </div>
            </CommandItem>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
