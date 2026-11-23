'use client';

import { createContext, useContext, useState } from 'react';

export type SelectedNames = Record<number, string>;

const Ctx = createContext<{ names: SelectedNames; setNames: (n: SelectedNames) => void }>({
  names: {},
  setNames: () => {},
});

export function SelectedRecipientsProvider({ children }: { children: React.ReactNode }) {
  const [names, setNames] = useState<SelectedNames>({});
  return <Ctx.Provider value={{ names, setNames }}>{children}</Ctx.Provider>;
}

export const useSelectedRecipients = () => useContext(Ctx);
