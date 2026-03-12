/**
 * GitHub OAuth access_token API 的返回结构
 * 文档：https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
 */
export interface GithubAccessTokenResponse {
  /**
   * OAuth 访问令牌，用于访问 GitHub API
   * 示例："gho_xxxxxxxxxxxxxxxxxxxxx"
   */
  access_token?: string;

  /**
   * token 类型，通常为 "bearer"
   */
  token_type?: string;

  /**
   * 授权范围（scope），多个 scope 用逗号分隔
   * 示例："public_repo,read:user"
   */
  scope?: string;

  /**
   * 错误代码，例如：
   * - "bad_verification_code"
   * - "incorrect_client_credentials"
   * - "redirect_uri_mismatch"
   */
  error?: string;

  /**
   * 错误描述，通常为英文提示
   * 示例："The code passed is incorrect or expired."
   */
  error_description?: string;

  /**
   * GitHub 文档链接，解释错误原因
   */
  error_uri?: string;
}


export class GithubOauthClient {
  redirect_uri: string
  client_id: string
  
  constructor (redirect_uri: string, client_id: string ) {
    this.redirect_uri = redirect_uri
    this.client_id = client_id
  }

  createAuthorizationURL(scope: string) {
    const params = new URLSearchParams({
      client_id: this.client_id,
      redirect_uri: this.redirect_uri,
      scope,
      allow_signup: "true"
    })

    return `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  async handleCallback (code: string) {
    const res = await fetch(`https://noisy-wood-098b.mqnu000.workers.dev/oauth/token?code=${code}`)
    const data: GithubAccessTokenResponse = await res.json()
    return data
  }
}