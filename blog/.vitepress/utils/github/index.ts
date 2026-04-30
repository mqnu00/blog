import { GraphQLClient } from 'graphql-request'

export function createGithubClient(token: string, proxyUrl?: string) {
  const customFetch = fetch

  return new GraphQLClient('https://api.github.com/graphql', {
    fetch: customFetch,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
