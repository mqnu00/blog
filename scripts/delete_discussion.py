import requests
import time

# ===== 配置信息 =====
GITHUB_TOKEN = ""
OWNER = "mqnu00"
REPO = "blog"

HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Content-Type": "application/json",
}

# GraphQL 查询：获取所有 Discussions
GET_DISCUSSIONS_QUERY = """
query($owner: String!, $repo: String!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    discussions(first: 50, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        number
      }
    }
  }
}
"""

# GraphQL 突变：删除 Discussion
DELETE_DISCUSSION_MUTATION = """
mutation($discussionId: ID!) {
  deleteDiscussion(input: {id: $discussionId}) {
    discussion {
      id
    }
  }
}
"""

def get_all_discussions():
    """获取仓库中所有 Discussion 的 ID"""
    discussions = []
    cursor = None
    has_next = True

    while has_next:
        variables = {
            "owner": OWNER,
            "repo": REPO,
            "cursor": cursor
        }

        response = requests.post(
            "https://api.github.com/graphql",
            json={"query": GET_DISCUSSIONS_QUERY, "variables": variables},
            headers=HEADERS
        )

        if response.status_code != 200:
            print(f"Error: {response.status_code}")
            print(response.json())
            break

        data = response.json()
        repo_data = data.get("data", {}).get("repository", {})
        discussions_data = repo_data.get("discussions", {})

        for node in discussions_data.get("nodes", []):
            discussions.append({
                "id": node["id"],
                "number": node["number"],
                "title": node["title"]
            })

        page_info = discussions_data.get("pageInfo", {})
        has_next = page_info.get("hasNextPage", False)
        cursor = page_info.get("endCursor")

        print(f"已获取 {len(discussions)} 个 Discussions...")

    return discussions

def delete_discussion(discussion_id, number):
    """删除单个 Discussion"""
    variables = {"discussionId": discussion_id}

    response = requests.post(
        "https://api.github.com/graphql",
        json={"query": DELETE_DISCUSSION_MUTATION, "variables": variables},
        headers=HEADERS
    )

    if response.status_code == 200:
        print(f"✅ 已删除 Discussion #{number}")
        return True
    else:
        print(f"❌ 删除失败 #{number}: {response.json()}")
        return False

if __name__ == "__main__":
    # 获取所有 Discussions
    print("正在获取所有 Discussions...")
    discussions = get_all_discussions()
    print(f"共找到 {len(discussions)} 个 Discussions")

    if not discussions:
        print("没有找到任何 Discussion")
        exit(0)

    # 确认删除
    confirm = input(f"⚠️ 确定要删除全部 {len(discussions)} 个 Discussions 吗？(yes/no): ")
    if confirm.lower() != "yes":
        print("已取消操作")
        exit(0)

    # 逐个删除
    for i, disc in enumerate(discussions, 1):
        print(f"[{i}/{len(discussions)}] 正在删除 Discussion #{disc['number']}: {disc['title'][:50]}...")
        delete_discussion(disc["id"], disc["number"])
        time.sleep(0.5)  # 避免请求过快

    print("操作完成！")