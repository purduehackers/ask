import { connect, type Config } from "@tursodatabase/serverless";

// oxlint-disable-next-line -- adapter requires any[] signatures to match better-sqlite3 interface
// oxlint-disable @typescript-eslint/no-explicit-any
class RemoteStatement {
  constructor(
    private config: Config,
    private sql: string,
  ) {}

  private async prepare() {
    const conn = connect(this.config);
    return conn.prepare(this.sql);
  }

  async run(...bindParameters: any[]) {
    const stmt = await this.prepare();
    return stmt.run(bindParameters);
  }

  async get(...bindParameters: any[]) {
    const stmt = await this.prepare();
    return stmt.get(bindParameters);
  }

  async all(...bindParameters: any[]) {
    const stmt = await this.prepare();
    return stmt.all(bindParameters);
  }

  async *iterate(...bindParameters: any[]): AsyncGenerator<any, void, unknown> {
    const stmt = await this.prepare();
    yield* stmt.iterate(bindParameters);
  }

  raw() {
    return this;
  }
  pluck() {
    return this;
  }
  safeIntegers() {
    return this;
  }
  bind() {
    return this;
  }
  columns(): any[] {
    return [];
  }
  get reader(): boolean {
    return false;
  }
  get source(): void {
    return undefined;
  }
  close(): void {}
  interrupt(): void {}
}

export class RemoteDatabase {
  private config: Config;
  private conn: ReturnType<typeof connect>;

  name = "";
  readonly = false;
  open = true;
  memory = false;
  inTransaction = false;

  constructor(url: string, options?: { authToken?: string }) {
    this.config = { url, authToken: options?.authToken };
    this.conn = connect(this.config);
  }

  async connect(): Promise<void> {}

  prepare(sql: string): RemoteStatement {
    return new RemoteStatement(this.config, sql);
  }

  async exec(sql: string): Promise<void> {
    await this.conn.exec(sql);
  }

  async close(): Promise<void> {
    await this.conn.close();
  }

  transaction(fn: (...args: any[]) => Promise<any>) {
    return async (...args: any[]) => {
      await this.exec("BEGIN");
      try {
        const result = await fn(...args);
        await this.exec("COMMIT");
        return result;
      } catch (e) {
        await this.exec("ROLLBACK");
        throw e;
      }
    };
  }

  async pragma(): Promise<any[]> {
    return [];
  }
  backup(): void {}
  serialize(): void {}
  function(): void {}
  aggregate(): void {}
  table(): void {}
  loadExtension(): void {}
  maxWriteReplicationIndex(): void {}
  interrupt(): void {}
  defaultSafeIntegers(): void {}
  async io(): Promise<void> {}
}
