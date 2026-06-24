import type { Metadata } from "next";
import { getOpenings } from "@/lib/data";
import { renderInline } from "@/lib/markdown";
import JobsTable, { JobItem } from "./JobsTable";

export const metadata: Metadata = { title: "岗位库" };

export default function JobsPage() {
  const jobs: JobItem[] = getOpenings().map((o) => ({
    company: o.company,
    slug: o.slug,
    tier: o.tier,
    stars: o.stars,
    hot: o.hot,
    pinned: o.pinned,
    attitude: o.attitude,
    excluded: o.excluded,
    title: o.title,
    location: o.location,
    anchor: o.anchor,
    html: renderInline(o.raw, "pipeline/companies"),
    sectionDate: o.sectionDate.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? o.sectionDate,
  }));

  return (
    <>
      <h1 className="page-title">📋 岗位库</h1>
      <p className="page-sub">
        15 家 pipeline 公司「当前 opening」段的聚合视图（来源 = pipeline/companies/*.md，扫岗 2–4
        周会重抓，岗位会变动）。
      </p>
      <JobsTable jobs={jobs} />
    </>
  );
}
