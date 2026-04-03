import {fetch, ProxyAgent} from "undici";
import {GraphQLClient} from "graphql-request";

export function createGithubClient(token: string, proxyUrl?: string) {
    let dispatcher;

    if (proxyUrl) {
        console.log(proxyUrl)
        dispatcher = new ProxyAgent(proxyUrl);
    }

    return new GraphQLClient("https://api.github.com/graphql", {
        fetch: (url, options) =>
            fetch(url, {
                ...options,
                dispatcher,
            }),
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}