import test from "node:test";
import assert from "node:assert/strict";

import { experienceEntries } from "../src/utils/experienceContent.js";

const data = {
  work_heading: "Work",
  education_heading: "Education",
  work_description:
    "<p><strong>Studio &amp; Partners<br>Position – Developer</strong></p><p>05/2023 – currently</p><p>• First responsibility.<br>• Second responsibility.</p>",
  education_description:
    "<p><strong>University – Computer Science<br>Degree – Engineer</strong></p><p>10/2021 – 10/2025</p><p>Built an application with Vue.js and Axios. Led a four-person team.</p>",
};

test("legacy experience metadata is separate from complete description text", () => {
  const [work, education] = experienceEntries(data, "en");
  assert.equal(work.organization, "Studio & Partners");
  assert.equal(work.role, "Developer");
  assert.equal(work.category, "Work");
  assert.equal(work.year, "2023");
  assert.deepEqual(work.points, [
    "First responsibility.",
    "Second responsibility.",
  ]);
  assert.equal(education.role, "Computer Science · Engineer");
  assert.deepEqual(education.points, [
    "Built an application with Vue.js and Axios.",
    "Led a four-person team.",
  ]);
  assert.equal(education.period, "10/2021 – 10/2025");
});

test("open-ended legacy periods use October 2026 without extra status fields", () => {
  const [work] = experienceEntries(data, "en");
  assert.equal(work.period, "05/2023 — 10/2026");
  assert(!("status" in work));
  assert(!("dateNote" in work));

  const polish = {
    ...data,
    work_description: data.work_description.replace(
      "05/2023 – currently",
      "05.2023 – teraz",
    ),
  };
  assert.equal(experienceEntries(polish)[0].period, "05.2023 — 10.2026");
});

test("a specific CMS period is never replaced by a fallback", () => {
  for (const period of [
    "05/2023 – 09/2026",
    "05/2023 – fixed-term collaboration",
  ]) {
    const source = {
      ...data,
      work_description: data.work_description.replace(
        "05/2023 – currently",
        period,
      ),
    };
    assert.equal(experienceEntries(source, "en")[0].period, period);
  }
  assert.equal(
    experienceEntries({ ...data, end_of_work: "31.10.2026" }, "en")[0].period,
    "05/2023 — 10/2026",
  );
});

test("empty records disappear and rich text cannot inject active content", () => {
  assert.deepEqual(experienceEntries({}), []);
  const source = {
    ...data,
    work_description: data.work_description.replace(
      "First responsibility.",
      "First<script>unsafe()</script> responsibility.",
    ),
  };
  assert.deepEqual(experienceEntries(source, "en")[0].points, [
    "First responsibility.",
    "Second responsibility.",
  ]);
});
