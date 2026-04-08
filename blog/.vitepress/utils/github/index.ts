import { GraphQLClient } from "graphql-request";

export function createGithubClient(token: string, proxyUrl?: string) {
    let customFetch: typeof fetch;

    // 浏览器环境
    customFetch = fetch;

    return new GraphQLClient("https://api.github.com/graphql", {
        fetch: customFetch,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}
