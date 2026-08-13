import { z } from "zod";

export const nameInputSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください").max(100),
});
export type NameInput = z.infer<typeof nameInputSchema>;
