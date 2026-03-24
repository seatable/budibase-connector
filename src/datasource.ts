import { IntegrationBase } from "@budibase/types"
import axios, { AxiosInstance } from "axios"

interface SeaTableConfig {
  serverUrl: string
  apiToken: string
}

function sanitizeError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? "unknown"
    const statusText = err.response?.statusText ?? ""
    const detail =
      err.response?.data?.error_msg ?? err.response?.data?.error_message ?? err.message
    return `HTTP ${status} ${statusText}: ${detail}`
  }
  return err instanceof Error ? err.message : "Unknown error"
}

class SeaTableIntegration implements IntegrationBase {
  private readonly serverUrl: string
  private readonly apiToken: string
  private http?: AxiosInstance
  private baseUuid?: string
  private tokenExpiresAt = 0

  constructor(config: SeaTableConfig) {
    this.serverUrl = config.serverUrl.replace(/\/$/, "")
    this.apiToken = config.apiToken
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.http && Date.now() < this.tokenExpiresAt) {
      return
    }

    const url = `${this.serverUrl}/api/v2.1/dtable/app-access-token/`
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
      timeout: 15_000,
    })

    const baseToken = res.data.access_token
    this.baseUuid = res.data.dtable_uuid
    const dtableServer: string = res.data.dtable_server ?? ""

    if (!baseToken || !this.baseUuid || !dtableServer) {
      throw new Error(
        "SeaTable token exchange failed: missing access_token, dtable_uuid, or dtable_server"
      )
    }

    this.tokenExpiresAt = Date.now() + 59 * 60 * 1000

    const baseURL = `${dtableServer.replace(/\/$/, "")}/api/v2/dtables/${this.baseUuid}`
    this.http = axios.create({
      baseURL,
      timeout: 30_000,
      headers: { Authorization: `Bearer ${baseToken}` },
    })
  }

  async create(query: { table: string; body: string }) {
    try {
      await this.ensureAuthenticated()
      const rowData = typeof query.body === "string" ? JSON.parse(query.body) : query.body
      const res = await this.http!.post("/rows/", {
        table_name: query.table,
        rows: [rowData],
      })
      return res.data.first_row ?? res.data
    } catch (err) {
      throw new Error(sanitizeError(err))
    }
  }

  async read(query: { table: string; limit?: number; view?: string }) {
    try {
      await this.ensureAuthenticated()
      const params: Record<string, unknown> = {
        table_name: query.table,
        start: 0,
        limit: query.limit || 100,
        convert_keys: true,
      }
      if (query.view) {
        params.view_name = query.view
      }
      const res = await this.http!.get("/rows/", { params })
      return res.data.rows ?? []
    } catch (err) {
      throw new Error(sanitizeError(err))
    }
  }

  async update(query: { table: string; rowId: string; body: string }) {
    try {
      await this.ensureAuthenticated()
      const rowData = typeof query.body === "string" ? JSON.parse(query.body) : query.body
      const res = await this.http!.put("/rows/", {
        table_name: query.table,
        updates: [{ row_id: query.rowId, row: rowData }],
      })
      return res.data
    } catch (err) {
      throw new Error(sanitizeError(err))
    }
  }

  async delete(query: { table: string; rowId: string }) {
    try {
      await this.ensureAuthenticated()
      const res = await this.http!.delete("/rows/", {
        data: { table_name: query.table, row_ids: [query.rowId] },
      })
      return res.data
    } catch (err) {
      throw new Error(sanitizeError(err))
    }
  }
}

export default SeaTableIntegration
