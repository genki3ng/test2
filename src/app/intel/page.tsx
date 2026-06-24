import type { Metadata } from "next";
import Link from "next/link";
import { getJds } from "@/lib/data";

export const metadata: Metadata = { title: "情报 · JD 档案" };

export default function IntelPage() {
  const jds = getJds();
  return (
    <>
      <h1 className="page-title">🕵️ 情报 · JD 深度档案</h1>
      <p className="page-sub">
        重点岗位的 JD 全文存档 + 对你的契合度分析（源：intel/jd/）。签证 / PERM 情报见{" "}
        <Link href="/docs/strategy/perm-by-company">perm-by-company.md</Link>。
      </p>
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>JD</th>
                <th>级别</th>
                <th>地点</th>
                <th>薪酬</th>
                <th>标记</th>
              </tr>
            </thead>
            <tbody>
              {jds.map((j) => (
                <tr key={j.file} style={j.flagged ? { opacity: 0.6 } : undefined}>
                  <td style={{ minWidth: 220 }}>
                    <Link href={`/docs/intel/jd/${j.file}`}>{j.title}</Link>
                  </td>
                  <td style={{ minWidth: 90 }}>{j.level}</td>
                  <td style={{ minWidth: 90 }}>{j.location}</td>
                  <td style={{ minWidth: 110 }}>{j.comp}</td>
                  <td>
                    {j.flagged === "CONTRACT" && <span className="pill red">合同工·已排除</span>}
                    {j.flagged === "ARCHIVED" && <span className="pill gray">留档</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
