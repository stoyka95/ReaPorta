type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  msg: string;
  ts: string;
  meta?: Record<string, unknown>;
}

function writeLog(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
  const payload: LogPayload = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...(meta ? { meta } : {}),
  };
  const line = `${JSON.stringify(payload)}\n`;
  if (level === "error") {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

export const log = {
  info: (msg: string, meta?: Record<string, unknown>) => writeLog("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => writeLog("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => writeLog("error", msg, meta),
};
