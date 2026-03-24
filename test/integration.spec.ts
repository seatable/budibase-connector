import SeaTableIntegration from "../src/datasource"

const SERVER_URL = process.env.SEATABLE_SERVER_URL
const API_TOKEN = process.env.SEATABLE_API_TOKEN
const TABLE_NAME = process.env.SEATABLE_TABLE_NAME || "Table1"

const skip = !process.env.INTEGRATION
const describeIf = skip ? describe.skip : describe

describeIf("SeaTable integration tests (live)", () => {
  let ds: SeaTableIntegration

  beforeAll(() => {
    if (!SERVER_URL || !API_TOKEN) {
      throw new Error(
        "SEATABLE_SERVER_URL and SEATABLE_API_TOKEN env vars are required"
      )
    }
    ds = new SeaTableIntegration({
      serverUrl: SERVER_URL,
      apiToken: API_TOKEN,
    })
  })

  it("reads rows from a table", async () => {
    const rows = await ds.read({ table: TABLE_NAME, limit: 10 })
    expect(Array.isArray(rows)).toBe(true)
  })

  it(
    "full CRUD lifecycle",
    async () => {
      // Create
      const created = await ds.create({
        table: TABLE_NAME,
        body: JSON.stringify({ Name: "Budibase Plugin Test" }),
      })
      expect(created._id).toBeDefined()
      const rowId: string = created._id

      // Read and verify
      const rows = await ds.read({ table: TABLE_NAME, limit: 100 })
      expect(rows.some((r: any) => r._id === rowId)).toBe(true)

      // Update
      const updated = await ds.update({
        table: TABLE_NAME,
        rowId,
        body: JSON.stringify({ Name: "Budibase Plugin Test Updated" }),
      })
      expect(updated).toBeDefined()

      // Delete
      const deleted = await ds.delete({ table: TABLE_NAME, rowId })
      expect(deleted).toBeDefined()

      // Verify deletion
      const afterDelete = await ds.read({ table: TABLE_NAME, limit: 100 })
      expect(afterDelete.some((r: any) => r._id === rowId)).toBe(false)
    },
    30_000
  )

  it("throws for invalid token", async () => {
    const bad = new SeaTableIntegration({
      serverUrl: SERVER_URL!,
      apiToken: "invalid-token",
    })
    await expect(bad.read({ table: TABLE_NAME })).rejects.toThrow()
  })
})
