// 文字bigram(2文字の組)を使った、日本語向けの簡易な文字列類似度計算。
// 外部ライブラリやAIを使わず、プログラムだけで「似ていそうな既存タスク」を
// 少数に絞り込むために使う(絞り込んだ後の最終判断はAIに任せる)。

function bigrams(text: string): Set<string> {
  const s = text.replace(/\s+/g, "");
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const gram of a) {
    if (b.has(gram)) intersection += 1;
  }
  return intersection / (a.size + b.size - intersection);
}

// 貼り付けられた文章と、各タスクのタイトルとの類似度を計算し、
// 似ている順に上位N件だけを返す(既存タスクが数百件に増えても費用が膨らまないようにするため)。
export function findSimilarTasks<T extends { id: string; title: string }>(
  text: string,
  tasks: T[],
  options: { limit?: number; threshold?: number } = {},
): T[] {
  const { limit = 10, threshold = 0.08 } = options;
  const textGrams = bigrams(text);

  return tasks
    .map((task) => ({ task, score: jaccard(textGrams, bigrams(task.title)) }))
    .filter((entry) => entry.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.task);
}
