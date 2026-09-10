export interface Section {
  id: string;
  label: string;
  group: string;
  routes?: string[];
  pages?: string[];
  rollup?: boolean;
}

export interface Widget {
  type: string;
  title: string;
  size: { w: number; h: number };
  symbolAware: boolean;
  provider: string;
  view: unknown;
}

const sections: Section[] = [];
const widgets: Widget[] = [];

export function RegisterSection(section: Section): void {
  sections.push(section);
}

export function RegisterWidget(widget: Widget): void {
  widgets.push(widget);
}

export function getSections(): readonly Section[] {
  return sections;
}

export function getWidgets(): readonly Widget[] {
  return widgets;
}
