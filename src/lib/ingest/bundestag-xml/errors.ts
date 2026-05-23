/**
 * Parser error classes. Always include a `source` field so callers can
 * report which file/protocol the error came from.
 */

export class BundestagXmlParseError extends Error {
  readonly source: string;
  constructor(message: string, source: string) {
    super(`[${source}] ${message}`);
    this.name = "BundestagXmlParseError";
    this.source = source;
  }
}

/** Thrown when the root element is not <dbtplenarprotokoll>. */
export class InvalidRootElementError extends BundestagXmlParseError {
  constructor(actualRoot: string, source: string) {
    super(`expected root <dbtplenarprotokoll>, got <${actualRoot}>`, source);
    this.name = "InvalidRootElementError";
  }
}

/** Thrown when required metadata (Wahlperiode, Sitzungsnummer, Datum) is missing. */
export class MissingMetadataError extends BundestagXmlParseError {
  constructor(field: string, source: string) {
    super(`missing required session metadata: ${field}`, source);
    this.name = "MissingMetadataError";
  }
}

/** Thrown when XML cannot be parsed at all (malformed). */
export class MalformedXmlError extends BundestagXmlParseError {
  constructor(detail: string, source: string) {
    super(`malformed XML: ${detail}`, source);
    this.name = "MalformedXmlError";
  }
}
