import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithQuery } from "./helpers/render";
import { App } from "../src/App";

beforeEach(() => localStorage.clear());

describe("App smoke test", () => {
  it("renders the hero with the app name", () => {
    renderWithQuery(<App />);
    expect(screen.getByText("FeedPop")).toBeInTheDocument();
  });

  it("shows a welcome message when no feeds are subscribed", () => {
    renderWithQuery(<App />);
    expect(screen.getByText(/welcome to feedpop/i)).toBeInTheDocument();
  });
});