import { _config } from "./config.js";
import { Config, createLogger } from "@nailbook/core";

/**
 * One root logger for the whole process — createLogger stands up a pino
 * transport (worker thread) per call, so it must only be called once.
 * Domains derive their own loggers with `log.child({ module })`.
 */
export const rootLogger = createLogger(_config as unknown as Config);

export const log = rootLogger.child({ module: "worker" });
