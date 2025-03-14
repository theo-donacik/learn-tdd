
import app from "../server";
import request from "supertest";
import Author from "../models/author";

describe("Verify GET /authors", () => {
    let consoleSpy: jest.SpyInstance;

    beforeAll(() => {
        consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterAll(() => {
        consoleSpy.mockRestore();
    });
    
    it("should respond with a list of author names and lifetimes, sorted by family name", async () => {
        const mockAuthors = [{
          first_name: "Author",
          family_name: "C",
          lifespan: "1902-1903"
        },
        {
          first_name: "Author",
          family_name: "A",
          lifespan: "1900-1901"
        },
        {
          first_name: "Author",
          family_name: "B",
          lifespan: "1901-1902"
        }];
        const expectedResponse = ["Author A 1900-1901", "Author B 1901-1902", "Author C 1902-1903"];
        Author.getAllAuthors = jest.fn().mockImplementationOnce((sort_opt) => {
            if (sort_opt["family_name"] === 1) {
              const sortedAuthors = [...mockAuthors]
              .sort((a, b) => a.family_name.localeCompare(b.family_name))
              return Promise.resolve(sortedAuthors.map(a => `${a.first_name} ${a.family_name} ${a.lifespan}`));
            }
            return Promise.resolve(null);
        });

        const response = await request(app).get(`/authors`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toStrictEqual(expectedResponse);
    });
  
    it("should respond with no authors found if database has no authors", async () => {  
        Author.getAllAuthors = jest.fn().mockResolvedValue([]);
        const response = await request(app).get("/authors");
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe("No authors found");
    });

      it("should respond with an error messange if there is an error processing the request", async () => {
        Author.getAllAuthors = jest.fn().mockRejectedValue("Database error");
        const response = await request(app).get(`/authors`);
        expect(response.statusCode).toBe(500);
        expect(response.text).toBe(`Error processing request`);
        expect(consoleSpy).toHaveBeenCalled();
    });
 });
