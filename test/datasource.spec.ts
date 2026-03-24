import axios from "axios"
import SeaTableIntegration from "../src/datasource"

jest.mock("axios")
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockHttp = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}

const TOKEN_RESPONSE = {
  data: {
    access_token: "test-access-token",
    dtable_uuid: "test-uuid-1234",
    dtable_server: "https://cloud.seatable.io/dtable-server/",
  },
}

function createIntegration() {
  return new SeaTableIntegration({
    serverUrl: "https://cloud.seatable.io",
    apiToken: "test-api-token",
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockedAxios.get.mockResolvedValue(TOKEN_RESPONSE)
  mockedAxios.create.mockReturnValue(mockHttp as any)
  mockedAxios.isAxiosError.mockReturnValue(false)
})

describe("authentication", () => {
  it("exchanges the API token for a base access token", async () => {
    const ds = createIntegration()
    mockHttp.get.mockResolvedValue({ data: { rows: [] } })

    await ds.read({ table: "Table1" })

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://cloud.seatable.io/api/v2.1/dtable/app-access-token/",
      expect.objectContaining({
        headers: { Authorization: "Bearer test-api-token" },
      })
    )
  })

  it("creates an axios instance with the correct base URL", async () => {
    const ds = createIntegration()
    mockHttp.get.mockResolvedValue({ data: { rows: [] } })

    await ds.read({ table: "Table1" })

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL:
          "https://cloud.seatable.io/dtable-server/api/v2/dtables/test-uuid-1234",
        headers: { Authorization: "Bearer test-access-token" },
      })
    )
  })

  it("throws on incomplete token response", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { access_token: "tok" },
    })
    const ds = createIntegration()

    await expect(ds.read({ table: "Table1" })).rejects.toThrow(
      "SeaTable token exchange failed"
    )
  })

  it("reuses token within expiry window", async () => {
    const ds = createIntegration()
    mockHttp.get.mockResolvedValue({ data: { rows: [] } })

    await ds.read({ table: "Table1" })
    await ds.read({ table: "Table1" })

    expect(mockedAxios.get).toHaveBeenCalledTimes(1)
  })
})

describe("create", () => {
  it("posts a new row", async () => {
    const ds = createIntegration()
    mockHttp.post.mockResolvedValue({
      data: { first_row: { _id: "row-abc", Name: "Test" } },
    })

    const result = await ds.create({
      table: "Table1",
      body: JSON.stringify({ Name: "Test" }),
    })

    expect(mockHttp.post).toHaveBeenCalledWith("/rows/", {
      table_name: "Table1",
      rows: [{ Name: "Test" }],
    })
    expect(result).toEqual({ _id: "row-abc", Name: "Test" })
  })

  it("throws on error", async () => {
    const ds = createIntegration()
    mockHttp.post.mockRejectedValue(new Error("Network error"))

    await expect(
      ds.create({ table: "Table1", body: '{"Name":"Test"}' })
    ).rejects.toThrow("Network error")
  })
})

describe("read", () => {
  it("fetches rows with correct parameters", async () => {
    const ds = createIntegration()
    mockHttp.get.mockResolvedValue({
      data: { rows: [{ _id: "r1", Name: "A" }] },
    })

    const result = await ds.read({ table: "Table1", limit: 50, view: "MyView" })

    expect(mockHttp.get).toHaveBeenCalledWith("/rows/", {
      params: {
        table_name: "Table1",
        start: 0,
        limit: 50,
        convert_keys: true,
        view_name: "MyView",
      },
    })
    expect(result).toEqual([{ _id: "r1", Name: "A" }])
  })

  it("defaults limit to 100", async () => {
    const ds = createIntegration()
    mockHttp.get.mockResolvedValue({ data: { rows: [] } })

    await ds.read({ table: "Table1" })

    expect(mockHttp.get).toHaveBeenCalledWith("/rows/", {
      params: expect.objectContaining({ limit: 100 }),
    })
  })

  it("throws on error", async () => {
    const ds = createIntegration()
    mockHttp.get.mockRejectedValue(new Error("Timeout"))

    await expect(ds.read({ table: "Table1" })).rejects.toThrow("Timeout")
  })
})

describe("update", () => {
  it("updates a row by ID", async () => {
    const ds = createIntegration()
    mockHttp.put.mockResolvedValue({ data: { success: true } })

    const result = await ds.update({
      table: "Table1",
      rowId: "row-abc",
      body: JSON.stringify({ Name: "Updated" }),
    })

    expect(mockHttp.put).toHaveBeenCalledWith("/rows/", {
      table_name: "Table1",
      updates: [{ row_id: "row-abc", row: { Name: "Updated" } }],
    })
    expect(result).toEqual({ success: true })
  })

  it("throws on error", async () => {
    const ds = createIntegration()
    mockHttp.put.mockRejectedValue(new Error("Forbidden"))

    await expect(
      ds.update({ table: "T", rowId: "r", body: "{}" })
    ).rejects.toThrow("Forbidden")
  })
})

describe("delete", () => {
  it("deletes a row by ID", async () => {
    const ds = createIntegration()
    mockHttp.delete.mockResolvedValue({ data: { success: true } })

    const result = await ds.delete({ table: "Table1", rowId: "row-abc" })

    expect(mockHttp.delete).toHaveBeenCalledWith("/rows/", {
      data: { table_name: "Table1", row_ids: ["row-abc"] },
    })
    expect(result).toEqual({ success: true })
  })

  it("throws on error", async () => {
    const ds = createIntegration()
    mockHttp.delete.mockRejectedValue(new Error("Not found"))

    await expect(
      ds.delete({ table: "Table1", rowId: "nope" })
    ).rejects.toThrow("Not found")
  })
})
