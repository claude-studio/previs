import type { TabsBlock as TabsBlockData } from '@previs/schema';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { BlockRenderer } from './BlockRenderer';

export function TabsBlock({ block }: { block: TabsBlockData }) {
  return (
    <section className="rounded-xl border border-hairline bg-canvas p-5">
      <Tabs defaultValue="tab-0">
        <TabsList aria-label="블록 탭">
          {block.items.map((item, index) => (
            <TabsTrigger key={`${item.label}-${index}`} value={`tab-${index}`}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {block.items.map((item, index) => (
          <TabsContent key={`${item.label}-${index}`} value={`tab-${index}`}>
            <div className="space-y-5">
              {item.blocks.map((child) => (
                <BlockRenderer key={child.id} block={child} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
