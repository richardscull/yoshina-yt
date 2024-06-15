import fs from "fs";
import { ZodObject, ZodRawShape } from "zod";

export const readJsonFile = async <T extends {}>({ path, schema }: { path: string; schema?: ZodObject<ZodRawShape> }) => {
  try {
    const file = fs.readFileSync(path, { encoding: "utf-8" });
    const parsedFile = JSON.parse(file);

    if (!schema) return parsedFile as T;

    const parsedSchema = await schema.safeParseAsync(parsedFile);

    if (!parsedSchema.success) {
      console.log(`[${new Date().toLocaleString()}] Schema validation failed for ${path}`);
      return null;
    }

    return parsedFile as T;
  } catch (err) {
    return null;
  }
};

export const writeJsonFile = ({ path, data }: { path: string; data: object }) => {
  try {
    const stringifiedData = JSON.stringify(data, null, 2);

    const directories = path.split("/").slice(0, -1);
    for (let i = 1; i <= directories.length; i++) {
      const directory = directories.slice(0, i).join("/");
      if (!fs.existsSync(directory)) fs.mkdirSync(directory);
    }

    fs.writeFileSync(path, stringifiedData);
  } catch (err) {
    console.log(`[${new Date().toLocaleString()}] Writing to ${path} failed`);
  }
};
