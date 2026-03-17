pub static TAG_RULES: &[(&str, &[&str])] = &[
    ("github", &["github", "git repo"]),
    ("cli", &["cli", "command line", "terminal", "shell", "bash"]),
    ("rust", &["rust", "cargo", "rustlang"]),
    (
        "python",
        &["python", "pip", "pypi", "django", "flask", "fastapi"],
    ),
    (
        "ai",
        &[
            "llm",
            "gpt",
            "claude",
            "gemini",
            "openai",
            "anthropic",
            "language model",
            "ai agent",
            "machine learning",
        ],
    ),
    (
        "security",
        &[
            "security",
            "vulnerabilit",
            "exploit",
            "hack",
            "breach",
            "cve",
            "malicious",
            "attack",
        ],
    ),
    (
        "open source",
        &["open-source", "open source", "mit license"],
    ),
    (
        "cloud",
        &[
            "aws",
            "cloudflare",
            "kubernetes",
            "k8s",
            "docker",
            "gcp",
            "azure",
        ],
    ),
    ("typescript", &["typescript", "deno", "type-safe"]),
    (
        "web",
        &[
            "frontend", "react", "vue", "angular", "nextjs", "vercel", "browser",
        ],
    ),
    (
        "devops",
        &["devops", "ci/cd", "pipeline", "deployment", "infra"],
    ),
    (
        "database",
        &["database", "postgres", "mysql", "redis", "sqlite", "duckdb"],
    ),
    (
        "llm",
        &[
            "large language model",
            "reasoning model",
            "fine-tun",
            "rag",
            "embedding",
            "benchmark",
        ],
    ),
    (
        "mobile",
        &["mobile", "ios", "android", "swift", "kotlin", "flutter"],
    ),
    (
        "startup",
        &[
            "startup",
            "funding",
            "seed round",
            "series a",
            "valuation",
            "raises $",
        ],
    ),
    ("linux", &["linux", "debian", "ubuntu", "kernel"]),
    (
        "performance",
        &["latency", "throughput", "benchmark", "faster", "optimize"],
    ),
];

pub fn assign_tags(title: &str, summary: &str) -> Vec<String> {
    let text = format!("{} {}", title, summary).to_lowercase();
    let mut tags: Vec<String> = TAG_RULES
        .iter()
        .filter(|(_, keywords)| keywords.iter().any(|kw| text.contains(kw)))
        .map(|(tag, _)| tag.to_string())
        .take(6)
        .collect();
    tags.dedup();
    tags
}
