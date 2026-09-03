"use client";

import { useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

const SAVE_DELAY_MS = 800;

// 取り組みカード上の「現在」「次にやること」「メモ」で共通して使う、
// フォーカスが外れた時 or 入力が一定時間止まった時に自動保存するフィールド用フック。
// サーバーから新しいinitialValueが渡された場合(他の変更でrouter.refresh()された場合など)は
// 編集中でない限りローカル値を追従させる。
export function useAutosaveField(
  initialValue: string,
  save: (value: string) => Promise<void>,
) {
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedValueRef = useRef(initialValue);

  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);
  if (initialValue !== prevInitialValue) {
    setPrevInitialValue(initialValue);
    setValue(initialValue);
  }

  useEffect(() => {
    savedValueRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function doSave(next: string) {
    if (next === savedValueRef.current) return;
    setStatus("saving");
    try {
      await save(next);
      savedValueRef.current = next;
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  function handleChange(next: string) {
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void doSave(next), SAVE_DELAY_MS);
  }

  function handleBlur() {
    if (timerRef.current) clearTimeout(timerRef.current);
    void doSave(value);
  }

  return { value, status, handleChange, handleBlur };
}
