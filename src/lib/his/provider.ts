import type { HISProvider } from "./types";
import { DbHISProvider } from "./dbHisProvider";

export function getHISProvider(): HISProvider {
  return new DbHISProvider();
}
