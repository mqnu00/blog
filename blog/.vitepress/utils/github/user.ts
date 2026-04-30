import { getSdk } from './graphql/github'
import { createGithubClient } from '@blog/.vitepress/utils/github/index'

export class GithubUserApi {
  private sdk
  private readonly owner: string
  private readonly repo: string

  constructor(token: string, owner: string, repo: string, proxyUrl?: string) {
    this.sdk = getSdk(createGithubClient(token, proxyUrl))
    this.owner = owner
    this.repo = repo
  }

  async getUserInfo(login: string) {
    const res = await this.sdk.GetUserInfo({ login })
    return res.user ?? null
  }
}
