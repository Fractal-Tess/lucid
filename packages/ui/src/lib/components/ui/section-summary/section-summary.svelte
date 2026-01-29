<script lang="ts">
  import * as Card from "../card";
  import * as Accordion from "../accordion";
  import type { SummaryData } from "./types";

  let { summary }: { summary: SummaryData } = $props();
</script>

<div class="space-y-6">
  <Card.Root>
    <Card.Header>
      <Card.Title>Overview</Card.Title>
    </Card.Header>
    <Card.Content>
      <p class="whitespace-pre-wrap text-muted-foreground leading-relaxed">
        {summary.content}
      </p>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Key Sections</Card.Title>
    </Card.Header>
    <Card.Content>
      <Accordion.Root type="multiple" class="w-full">
        {#each summary.sections as section, i (i)}
          <Accordion.Item value="item-{i}">
            <Accordion.Trigger class="text-left font-medium">{section.title}</Accordion.Trigger>
            <Accordion.Content>
              <div class="whitespace-pre-wrap text-muted-foreground leading-relaxed pt-2">
                {section.content}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        {/each}
      </Accordion.Root>
    </Card.Content>
  </Card.Root>
</div>
