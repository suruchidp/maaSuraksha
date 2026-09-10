import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type Source = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      if (source === "body") {
        req.body = parsed;
      } else if (source === "query") {
        req.query = parsed as Request["query"];
      } else {
        req.params = parsed as Request["params"];
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}