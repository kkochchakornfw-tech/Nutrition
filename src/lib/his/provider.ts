import type { HISProvider } from "./types";
import { DbHISProvider } from "./dbHisProvider";
import { MockHISProvider } from "./mockHisProvider";

export function getHISProvider(): HISProvider {
  return process.env.HIS_PROVIDER === "his"
    ? new DbHISProvider()
    : new MockHISProvider();
}
