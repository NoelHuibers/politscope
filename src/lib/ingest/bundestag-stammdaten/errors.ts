export class StammdatenParseError extends Error {
  readonly source: string;
  constructor(message: string, source: string) {
    super(`[${source}] ${message}`);
    this.name = "StammdatenParseError";
    this.source = source;
  }
}

export class InvalidStammdatenRootError extends StammdatenParseError {
  constructor(actualRoot: string, source: string) {
    super(`expected root <DOCUMENT>, got <${actualRoot}>`, source);
    this.name = "InvalidStammdatenRootError";
  }
}
