import assert from "node:assert/strict";
import test from "node:test";
import { priceForRegion } from "../src/lib/region.ts";
import {
  isLebanonAddress,
  regionFromAddress,
  visitorAddress,
} from "../src/lib/visitor-region.ts";

test("Lebanon pays the base price and everywhere else pays 2.5x", () => {
  assert.equal(priceForRegion(1000, "LB"), 1000);
  assert.equal(priceForRegion(1000, "INTL"), 2500);
  assert.equal(priceForRegion(1, "INTL"), 3);
});

test("a Lebanese allocation is local pricing and a public address elsewhere is not", () => {
  assert.equal(isLebanonAddress("5.8.128.1"), true);
  assert.equal(regionFromAddress("5.8.128.1"), "LB");
  assert.equal(isLebanonAddress("8.8.8.8"), false);
  assert.equal(regionFromAddress("8.8.8.8"), "INTL");
  assert.equal(isLebanonAddress("2a00:1580::1"), true);
});

test("the address nginx recorded wins over a forged forwarding header", () => {
  const headers = new Headers({
    "x-real-ip": "8.8.8.8",
    "x-forwarded-for": "5.8.128.1",
  });
  assert.equal(visitorAddress(headers), "8.8.8.8");
  assert.equal(regionFromAddress(visitorAddress(headers)), "INTL");
});

test("without x-real-ip the last forwarding hop is the one nginx appended", () => {
  const abroad = new Headers({ "x-forwarded-for": "5.8.128.1, 8.8.8.8" });
  assert.equal(regionFromAddress(visitorAddress(abroad)), "INTL");
  const local = new Headers({ "x-forwarded-for": "8.8.8.8, 5.8.128.1" });
  assert.equal(regionFromAddress(visitorAddress(local)), "LB");
});

test("a private address is not a country", () => {
  assert.equal(visitorAddress(new Headers({ "x-real-ip": "127.0.0.1" })), null);
  assert.equal(visitorAddress(new Headers({ "x-real-ip": "10.1.2.3" })), null);
});
