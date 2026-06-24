// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentCount } from "./comment-count";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  mockFetch.mockReset();
});

describe("CommentCount", () => {
  it("shows a placeholder before the count resolves", () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<CommentCount artifactId="courses/src/post" />);
    expect(screen.getByText("— comentários")).toBeInTheDocument();
  });

  it("renders the count and pluralizes once loaded", async () => {
    mockFetch.mockResolvedValue({ json: async () => [{ id: "a" }, { id: "b" }] });
    render(<CommentCount artifactId="courses/src/post" />);
    await waitFor(() => expect(screen.getByText("2 comentários")).toBeInTheDocument());
    expect(mockFetch).toHaveBeenCalledWith("/api/comments/courses/src/post");
  });

  it("uses the singular form for a single comment", async () => {
    mockFetch.mockResolvedValue({ json: async () => [{ id: "a" }] });
    render(<CommentCount artifactId="courses/src/post" />);
    await waitFor(() => expect(screen.getByText("1 comentário")).toBeInTheDocument());
  });

  it("keeps the placeholder when the request fails", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));
    render(<CommentCount artifactId="courses/src/post" />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(screen.getByText("— comentários")).toBeInTheDocument();
  });
});
