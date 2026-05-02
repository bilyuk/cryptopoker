import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WelcomeScreen } from "./welcome-screen";

describe("WelcomeScreen", () => {
  it("uses guest-session copy instead of account sign-in controls", () => {
    const html = renderToStaticMarkup(<WelcomeScreen onEnter={() => undefined} />);

    expect(html).toContain("Guest Player");
    expect(html).toContain("This browser keeps your Player and Display Name for next time.");
    expect(html).toContain("Take a Seat");
    expect(html).not.toContain("Sign In");
    expect(html).not.toContain("Play as Guest");
  });
});
