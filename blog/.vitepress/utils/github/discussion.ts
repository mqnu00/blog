import { getSdk } from "../github/graphql/github";
import {createGithubClient} from "@blog/.vitepress/utils/github/index";

export class GithubDiscussApi {
    private sdk;
    private readonly owner: string;
    private readonly repo: string;
    private readonly repoId: string;

    constructor(
        token: string,
        owner: string,
        repo: string,
        repoId: string,
        proxyUrl?: string
    ) {
        this.sdk = getSdk(createGithubClient(token, proxyUrl));
        this.owner = owner;
        this.repo = repo;
        this.repoId = repoId;
    }

    async getDiscussionCount() {
        const res = await this.sdk.GetDiscussionCount({
            owner: this.owner,
            repo: this.repo,
        });

        return res.repository?.discussions?.totalCount ?? 0;
    }

    async getDiscussionByNumber(
        number: number,
        start = 0,
        limit = 20
    ) {
        let after: string | undefined = undefined;
        let remaining = start;

        // 1. 自动翻页找到 start 对应的 cursor
        while (remaining > 0) {
            const pageSize = Math.min(remaining, 50); // 每次最多取 50 条

            try {
                const res = await this.sdk.GetDiscussionByNumber({
                    owner: this.owner,
                    repo: this.repo,
                    number,
                    first: pageSize,
                    after,
                });
            } catch (err: any) {
                const msg = err.response?.errors?.[0]?.message;
                if (msg?.includes("Could not resolve to a Discussion")) {
                    return null; // ← 正确处理
                }
                throw err;
            }

            const comments = res.repository?.discussion?.comments;
            if (!comments) return null;

            // 如果没有下一页，提前结束
            if (!comments.pageInfo.hasNextPage) break;

            after = comments.pageInfo.endCursor!;
            remaining -= pageSize;
        }

        // 2. 用找到的 cursor 获取目标区间
        try {
            const finalRes = await this.sdk.GetDiscussionByNumber({
                owner: this.owner,
                repo: this.repo,
                number,
                first: limit,
                after,
            });
            return finalRes.repository?.discussion ?? null;
        } catch (err) {
            const msg = err.response?.errors?.[0]?.message;
            if (msg?.includes("Could not resolve to a Discussion")) {
                return null; // ← 正确处理
            }
            throw err;
        }
    }


    async getDiscussionComment(
        commentId: string,
        replyStart = 0,
        replyLimit = 20,
    ) {
        let after: string | undefined = undefined;
        let remaining = replyStart;

        // 1. 自动翻页找到 replyStart 对应的 cursor
        while (remaining > 0) {
            const pageSize = Math.min(remaining, 50); // 每次最多取 50 条

            const res = await this.sdk.GetDiscussionCommentReply({
                commentId,
                first: pageSize,
                after,
            });

            const replies = res.node?.replies;
            if (!replies) return [];

            // 如果没有下一页，提前结束
            if (!replies.pageInfo.hasNextPage) break;

            after = replies.pageInfo.endCursor!;
            remaining -= pageSize;
        }

        // 2. 用找到的 cursor 获取目标区间
        const finalRes = await this.sdk.GetDiscussionCommentReply({
            commentId,
            first: replyLimit,
            after,
        });

        return finalRes.node?.replies?.nodes ?? [];
    }

    async createDiscussion(
        title: string,
        body: string,
        categoryId: string
    ) {

        // 创建 Discussion
        const res = await this.sdk.CreateDiscussion({
            repositoryId: this.repoId,
            title,
            body,
            categoryId,
        });

        return res.createDiscussion?.discussion ?? null;
    }


}
