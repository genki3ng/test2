# 投递管道（Pipeline）

> 记录每家公司从研究到决策的全过程。主表见 [tracker.md](tracker.md)，单公司详情见 [companies/](companies/)。
> 内推渠道（谁能帮推、怎么推）见 [referrals.md](referrals.md)。

## 状态模型

```
researching → referral → applied → recruiter → phone → onsite → offer → negotiation → decision
```

| 状态 | 含义 |
|---|---|
| `researching` | 在研究公司/岗位/绿卡政策 |
| `referral` | 已请求/拿到内推 |
| `applied` | 已投递 |
| `recruiter` | recruiter screen 阶段 |
| `phone` | 电话/技术初面 |
| `onsite` | onsite / 虚拟 onsite 全套 |
| `offer` | 已拿 offer |
| `negotiation` | 谈判中 |
| `decision` | 已决定（accept / decline） |
| `rejected` / `withdrawn` | 被拒 / 主动退出 |

## 用法

1. 新公司：从 [`companies/_TEMPLATE.md`](companies/_TEMPLATE.md) 复制为 `companies/<company>.md`。
2. 在 [tracker.md](tracker.md) 加一行。
3. 每次有进展，更新两处 + 在 [journal.md](../log/journal.md) 记一笔。
