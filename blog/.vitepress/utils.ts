import fetch from 'node-fetch'

export interface GithubHistoryOptions {
  owner: string
  repo: string
  filePath: string
  token?: string
}

export interface GithubCommitItem {
  sha: string
  author: string
  date: string
  message: string
  url: string
}

export async function getGithubHistory({
  owner,
  repo,
  filePath,
  token
}: GithubHistoryOptions): Promise<GithubCommitItem[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(filePath)}`
  console.log(url)

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { headers })

  if (!res.ok) {
    console.error(`GitHub API error: ${res.status} ${res.statusText}`)
    return []
  }

  const commits = await res.json()

  return commits.map((c: any) => ({
    sha: c.sha,
    author: c.commit.author.name,
    date: c.commit.author.date,
    message: c.commit.message,
    url: c.html_url
  }))
}
