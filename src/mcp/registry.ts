import fs from "fs";
import yaml from "js-yaml";

export interface MCPTool {
    name: string;
    description: string;
    endpoint: string;
    method?: "GET" | "POST";
    parameters?: Record<string, string>;
    response?: string;
}

export interface MCPConfig {
    name: string;
    description: string;
    version: string;
    tools: MCPTool[];
}

let cached: MCPConfig | null = null;

export const loadMCPConfig = (path = "./src/copilot.yml"): MCPConfig => {
    if (cached) return cached;

    if (!fs.existsSync(path)) {
        throw new Error(`copilot.yml not found at ${path}`);
    }

    const text = fs.readFileSync(path, "utf8");
    const parsed = yaml.load(text) as MCPConfig;

    if (!parsed?.tools?.length) {
        throw new Error("Invalid copilot.yml — tools list missing or empty.");
    }

    cached = parsed;
    return cached;
};
